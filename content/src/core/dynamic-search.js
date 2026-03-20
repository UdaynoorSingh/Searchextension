import * as Parser from "./parser.js";
import * as Iterator from "./iterator.js";
import * as Highlighter from "./highlighter.js";
import * as Normalizer from "./normalizer.js";
import * as Matcher from "./matcher.js";
import * as Constants from "../_lib/constants.js";

let domObservers = [];

export function startDynamicSearch(query, matcherOptions, normalizerOptions, parserOptions, signal, shadowRoots) {

    stopDynamicSearch();

    observe(query, matcherOptions, normalizerOptions, parserOptions, signal, document.body, shadowRoots);

    shadowRoots.forEach((sr) => {
        observe(query, matcherOptions, normalizerOptions, parserOptions, signal, sr, shadowRoots);
    });
}

function observe(query, matcherOptions, normalizerOptions, parserOptions, signal, root, shadowRoots) {
    // ? Browser batches newly added mutations based on execution event loop not based on time
    const domObserver = new MutationObserver((mutations) => {

        const newTextNodes = [];

        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {


                    if (node.nodeType === Node.ELEMENT_NODE) {

                        if (node.tagName === Constants.HIGHLIGHTED_EL_TAGNAME && node.classList.contains(Constants.HIGHLIGHTED_EL_CLASSNAME)) continue;
                        if (Constants.IGNORED_TAGS.has(node.tagName)) continue;

                        // ? getTextNode will do filtering for child elements but we have to also filter roots  as well
                        if (!parserOptions.includeNav && Constants.NAV_TAGS.has(node.tagName) && node.tagName !== "A") {
                            continue;
                        }

                        // ? Third option is so that when code element is inside of Navigations it doesn't reject that element
                        if (!parserOptions.includeCode && Constants.CODE_TAGS.has(node.tagName) && !node.closest(Constants.NAV_SELECTOR)) {
                            continue;
                        }


                        const textNodes = [];
                        if (node.shadowRoot) {
                            if (shadowRoots.indexOf(node.shadowRoot) === -1) {
                                shadowRoots.push(node.shadowRoot);
                                // ? Observer new shadowroot as well since it will not be part of .forEach loop
                                observe(query, matcherOptions, normalizerOptions, parserOptions, signal, node.shadowRoot, shadowRoots);
                            }
                            Parser.getTextNodes(node.shadowRoot, shadowRoots, textNodes, parserOptions);
                        }

                        // ? A node can have shadowRoot attached and normal content as well
                        Parser.getTextNodes(node, shadowRoots, textNodes, parserOptions);
                        newTextNodes.push(...textNodes);

                    } else if (node.nodeType === Node.TEXT_NODE) {
                        // ? Text nodes aren't going to parser so we must filter them here as well  
                        // * Everytime we see NodeFilter.FILTER_REJECT we continue other wise we push it
                        if (!node.nodeValue.trim()) continue;

                        // ? OMG this was the error finally detected by gemini lol
                        // ? We were skipping mark tags 
                        const isNextToMark = node.previousSibling?.classList?.contains(Constants.HIGHLIGHTED_EL_CLASSNAME) ||
                            node.nextSibling?.classList?.contains(Constants.HIGHLIGHTED_EL_CLASSNAME);

                        if (isNextToMark) continue;


                        // If includeMain is false, we must verify this text belongs to a Nav or Code block
                        if (!parserOptions.includeMain) {
                            const parent = node.parentElement;
                            if (!parent) continue;

                            const inNav = parserOptions.includeNav && parent.closest(Constants.NAV_SELECTOR);
                            const inCode = parserOptions.includeCode && parent.closest(Constants.CODE_SELECTOR);

                            if (!inNav && !inCode) {
                                continue;
                            }
                        }

                        newTextNodes.push(node);
                    }
                }
                // ? I didn't write else-if i hope it works
            } else if (mutation.type === 'characterData') {
                // A React/Vue app dynamically changed a text node's value
                if (mutation.target.nodeValue.trim()) {

                    const isNextToMark = mutation.target.previousSibling?.classList?.contains(Constants.HIGHLIGHTED_EL_CLASSNAME) ||
                        mutation.target.nextSibling?.classList?.contains(Constants.HIGHLIGHTED_EL_CLASSNAME);

                    if (!isNextToMark) {

                        if (!parserOptions.includeMain) {
                            const parent = mutation.target.parentElement;
                            if (!parent) continue;

                            const inNav = parserOptions.includeNav && parent.closest(Constants.NAV_SELECTOR);
                            const inCode = parserOptions.includeCode && parent.closest(Constants.CODE_SELECTOR);

                            if (!inNav && !inCode) {
                                continue;
                            }
                        }

                        newTextNodes.push(mutation.target);
                    }
                }
            }
        }

        if (newTextNodes.length > 0) {
            // ! Optional: Debounce this call to avoid blocking the main thread during heavy DOM updates
            processDynamicNodes(newTextNodes, query, matcherOptions, normalizerOptions, signal);
        }
    });

    domObserver.observe(root, {
        childList: true,
        subtree: true,
        characterData: true
    });
    domObservers.push(domObserver);
}


export function stopDynamicSearch() {
    if (domObservers.length > 0) {
        domObservers.forEach(domObserver => {
            domObserver.disconnect();
        });
        domObservers = [];
    }
}



async function processDynamicNodes(newTextNodes, query, matcherOptions, normalizerOptions, signal) {
    if (signal.aborted) return;

    const nodeObjs = [];

    for (let i = 0; i < newTextNodes.length; i++) {

        const normalizedTextContent = Normalizer.normalize(newTextNodes[i].textContent, normalizerOptions);
        nodeObjs.push({ node: newTextNodes[i], normalizedTextContent, matches: [] });
    }

    for (let i = 0; i < nodeObjs.length; i++) {
        nodeObjs[i].matches = Matcher.match(nodeObjs[i].normalizedTextContent, query, matcherOptions);
    }

    for (let i = 0; i < nodeObjs.length; i++) {
        if (!Parser.isNodeVisible(nodeObjs[i].node)) continue;

        for (let j = nodeObjs[i].matches.length - 1; j >= 0; j--) {
            const match = nodeObjs[i].matches[j];

            Iterator.appendNode(Highlighter.highlightTextNode(nodeObjs[i].node, match.startIndex, match.matchLength));
        }
    }
}