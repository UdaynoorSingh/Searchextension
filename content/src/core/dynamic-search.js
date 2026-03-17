import * as Parser from "./parser.js";
import * as Iterator from "./iterator.js";
import * as Highlighter from "./highlighter.js";
import * as Normalizer from "./normalizer.js";
import * as Matcher from "./matcher.js";
import * as Constants from "../_lib/constants.js";

let domObserver = null;

export function startDynamicSearch(query, matcherOptions, normalizerOptions, parserOptions, signal) {
    if (domObserver) domObserver.disconnect();

    // ? Browser batches newly added mutations based on execution event loop not based on time
    domObserver = new MutationObserver((mutations) => {

        const newTextNodes = [];

        for (const mutation of mutations) {

            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {


                    if (node.nodeType === Node.ELEMENT_NODE) {

                        if (node.tagName === Constants.HIGHLIGHTED_EL_TAGNAME && node.classList.contains(Constants.HIGHLIGHTED_EL_CLASSNAME)) continue;
                        if (Constants.IGNORED_TAGS.has(node.tagName)) continue;


                        const textNodes = Parser.getTextNodes(node, parserOptions);
                        newTextNodes.push(...textNodes);

                    } else if (node.nodeType === Node.TEXT_NODE) {

                        if (node.nodeValue.trim()) {
                            newTextNodes.push(node);
                        }
                    }
                }
            }

            // ! Add logic for this
            // else if (mutation.type === 'characterData') {
            //     newTextNodes.push(mutation.target);
            // }
        }

        if (newTextNodes.length > 0) {
            // ! Optional: Debounce this call to avoid blocking the main thread during heavy DOM updates
            processDynamicNodes(newTextNodes, query, matcherOptions, normalizerOptions, signal);
        }
    });

    domObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
}

export function stopDynamicSearch() {
    if (domObserver) {
        domObserver.disconnect();
        domObserver = null;
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


    // ! need to add logic for matcher


    for (let i = 0; i < nodeObjs.length; i++) {
        if (!Parser.isNodeVisible(nodeObjs[i].node)) continue;

        for (let j = nodeObjs[i].matches.length - 1; j >= 0; j--) {
            const match = nodeObjs[i].matches[j];
            // ? facing error in highlighter
            Iterator.appendNode(Highlighter.highlightTextNode(nodeObjs[i].node, match.startIndex, match.matchLength));
        }
    }
}