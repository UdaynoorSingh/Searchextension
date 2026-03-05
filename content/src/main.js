'use strict';
import * as UiSeter from "./ui/ui.js";
import * as Parser from "./core/parser.js";
import * as Highlighter from "./core/highlighter.js";
import * as Normalizer from "./core/normalizer.js";
import * as Matcher from "./core/matcher.js";
import * as Utils from "./_lib/utils.js"


let searchContainer = null;
let searchInput = null;

let controller = null;

// ! Remember if you add a new object here and in uiStates you have to bridge them by proxy in uiStates
const normalizerOptions = { removeDiacritics: true, caseInsensitive: true };
const parserOptions = { includeMain: true, includeNav: true, includeCode: true };
// ? possible searchTypes "Exact", "RegEx", "Semantic", "Fuzzy", "Phonetic" 
const matcherOptions = { matchType: "Exact", matchWhole: false }


async function search(query) {
    Highlighter.clearHighlights();
    if (controller) controller.abort();

    controller = new AbortController();
    const signal = controller.signal;



    signal.addEventListener('abort', () => {
        console.log("cleared the prev query highlights: " + query);
        Highlighter.clearHighlights();
    });

    try {
        if (!query) {
            Highlighter.clearHighlights();
            return;
        }
        else {
            // ! Will need to add logic where query is too big
            query = Normalizer.normalize(query, normalizerOptions);


            const nodes = Parser.getTextNodes(document.body, parserOptions);
            const nodeObjs = [];

            for (let i = 0; i < nodes.length; i++) {
                const normalizedTextContent = Normalizer.normalize(nodes[i].textContent, normalizerOptions);
                nodeObjs.push({ node: nodes[i], normalizedTextContent, matches: [] });
            }


            if (matcherOptions.matchType === "Semantic") {
                const nodeChunksObjs = [];
                for (let i = 0; i < nodeObjs.length; i++) {
                    const chunks = Utils.splitReadableContent(nodeObjs[i].normalizedTextContent);
                    nodeObjs[i].chunks = chunks;

                    nodeChunksObjs.push({ nodeIndex: i, chunks });
                }

                await chrome.runtime.sendMessage({ target: "background", action: "semantic-search-embed-content", nodeChunksObjs, url: Utils.getCacheKeyUrl(window.location.href)});
                const allMatches = await chrome.runtime.sendMessage({ target: "background", action: "semantic-search-query", query: query });
                
                for (let i = 0; i < allMatches.length; i++) {
                    const nodeIndex = allMatches[i].nodeIndex;
                    
                    for (let j = 0; j < allMatches[i].chunkIndices.length; j++) {
                        let startIndex = 0;

                        for (let k = 0; k < allMatches[i].chunkIndices[j]; k++) {
                            startIndex += nodeObjs[nodeIndex].chunks[k].length;
                        }
                        let matchLength = nodeObjs[nodeIndex].chunks[j].length;
                        nodeObjs[nodeIndex].matches.push({startIndex, matchLength});
                    }
                }
            
            }
            else {
                for (let i = 0; i < nodeObjs.length; i++) {
                    nodeObjs[i].matches = Matcher.match(nodeObjs[i].normalizedTextContent, query, matcherOptions);
                }
            }

            // ! Need to remove matches that are not visible

            for (let i = 0; i < nodeObjs.length; i++) {
                for (let j = nodeObjs[i].matches.length - 1; j >= 0; j--) {
                    const match = nodeObjs[i].matches[j];
                    Highlighter.highlightTextNode(nodeObjs[i].node, match.startIndex, match.matchLength);
                }
            }
        }

        // console.timeEnd("Search Time");
        // if (signal.aborted) return;
        // console.log("tried searching " + query + ". Aborted");
    } catch (error) {
        console.error(error);
    }
}



function init() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.target === "tab") {
            switch (message.action) {
                case "search-current-page":

                    const selectedText = window.getSelection().toString();

                    if (!searchContainer) {
                        // ? Since the variables are already declared we have to use parantesis
                        // ? Name aliasing actualNameComing : newNameHere 
                        ({ input: searchInput, container: searchContainer } = UiSeter.setupContainer(parserOptions, normalizerOptions, matcherOptions, search));
                        searchInput.value = selectedText;
                        searchInput.focus();
                        searchInput.select();
                        search(searchInput.value);
                    } else if (searchContainer.style.display === "none") {
                        searchContainer.style.display = "flex";
                        if (selectedText !== "") {
                            searchInput.value = selectedText;
                        }
                        searchInput.focus();
                        searchInput.select();

                        search(searchInput.value);
                    } else {
                        if (selectedText !== "") {
                            searchInput.value = selectedText;
                        }

                        searchInput.focus();
                        searchInput.select();

                        search(searchInput.value);
                    }
                    break;

                default:
                    break;
            }

        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && searchContainer && searchContainer.style.display !== "none") {
            e.preventDefault();
            searchContainer.style.display = "none";
            // ? When closing you should remove all matches
            search("");
        }
    });
}


export function interceptGlobalKeyEvents(shadowHostElement) {
    function blockHostKeybinds(e) {
        if (e.key === "Escape") return;
        // e.composedPath() returns the event's path, including your shadow host
        if (e.composedPath().includes(shadowHostElement)) {
            // Stop the event from reaching the website's listeners
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }

    // The 'true' argument is critical. It forces your listener to run in the 
    // Capture Phase (top-down), beating the website's bubbling listeners.
    window.addEventListener('keydown', blockHostKeybinds, true);
    window.addEventListener('keyup', blockHostKeybinds, true);
    window.addEventListener('keypress', blockHostKeybinds, true);
}

init();