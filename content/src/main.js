'use strict';
import * as UiSeter from "./ui/ui.js";
import * as Parser from "./core/parser.js";
import * as Highlighter from "./core/highlighter.js";
import * as Normalizer from "./core/normalizer.js";
import * as Matcher from "./core/matcher.js";



let searchContainer = null;
let searchInput = null;

let controller = null;

// ! Remember if you add a new object here and in uiStates you have to bridge them by proxy in uiStates
const normalizerOptions = { removeDiacritics: true, caseInsensitive: true };
const parserOptions = { includeMain: true, includeNav: true, includeCode: true };
// ? possible searchTypes "Exact", "RegEx", "Semantic", "Fuzzy", "Phonetic" 
const matcherOptions = { matchType: "Exact", matchWhole: false }


async function search(query) {
    // console.time("Search Time");
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
            if (normalizerOptions.caseInsensitive) {
                query = query.toLowerCase();
            }

            const nodes = Parser.getTextNodes(document.body, parserOptions);
            const nodeObjs = [];

            for (let i = 0; i < nodes.length; i++) {
                const normalizedTextContent = Normalizer.normalize(nodes[i].textContent, normalizerOptions);
                nodeObjs.push({ node: nodes[i], normalizedTextContent, matches: [] });
            }

            for (let i = 0; i < nodeObjs.length; i++) {
                nodeObjs[i].matches = Matcher.match(nodeObjs[i].normalizedTextContent, query, matcherOptions);

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
        if (message.for === "search-current-page") {
            if (!searchContainer) {
                // ? Since the variables are already declared we have to use parantesis
                // ? Name aliasing actualNameComing : newNameHere 
                ({ input: searchInput, container: searchContainer } = UiSeter.setupContainer(parserOptions, normalizerOptions, matcherOptions, search));
                searchInput.focus();
            } else if (searchContainer.style.display === "none") {
                searchContainer.style.display = "flex";
                searchInput.focus();
                searchInput.select();

                search(searchInput.value);
            } else {
                searchInput.focus();
                searchInput.select();
            }
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && searchContainer && searchContainer.style.display !== "none") {
            e.preventDefault();
            searchContainer.style.display = "none";
            // When closing you should remove all matches
            search("");
        }
    });
}

init();