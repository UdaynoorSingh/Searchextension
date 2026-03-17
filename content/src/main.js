// ! Be extremely careful high chance of making a circular depandency in main and UiSeter;
'use strict';
import * as Constants from "./_lib/constants.js";
import * as UiSeter from "./ui/ui.js";
import * as Parser from "./core/parser.js";
import * as Highlighter from "./core/highlighter.js";
import * as Normalizer from "./core/normalizer.js";
import * as Matcher from "./core/matcher.js";
import * as Utils from "./_lib/utils.js";
import * as Iterator from "./core/iterator.js";
import { stopDynamicSearch, startDynamicSearch } from "./core/dynamic-search.js";

let searchContainer = null;
let searchInput = null;
let shadowRoot = null;
let shadowRootHost = null;
let iteratorPane = null;

let controller = null;

let lastQuery = null;
let optionsChangedObj = { optionsChanged: false };



// ! Remember if you add a new object here and in uiStates you have to bridge them by proxy in uiStates
export const normalizerOptions = { matchDiacritics: false, caseInsensitive: true };
export const parserOptions = { includeMain: true, includeNav: true, includeCode: true };
// ? possible searchTypes "Exact", "RegEx", "Fuzzy", "Phonetic" 
export const matcherOptions = { matchType: "Exact", matchWhole: false }


async function search(query) {


    if (query === lastQuery && !optionsChangedObj.optionsChanged) {
        return;
    }

    lastQuery = query;
    optionsChangedObj.optionsChanged = false;


    if (controller) controller.abort();

    stopDynamicSearch(); // ? Remove older observer
    controller = new AbortController();
    const signal = controller.signal;

    Iterator.clearNodes();
    Highlighter.clearHighlights();
    UiSeter.updateSearchState(Constants.SEARCH_STATES.searching);

    try {
        if (!query) {
            UiSeter.updateSearchState(Constants.SEARCH_STATES.idle);
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

            for (let i = 0; i < nodeObjs.length; i++) {
                nodeObjs[i].matches = Matcher.match(nodeObjs[i].normalizedTextContent, query, matcherOptions);
            }


            // ? Remember the if the user presses or changes the search query then if this is running it is not going to stop
            // ? It will registar the new search but it will strictly wait for this to end as no await is being used after this line

            Iterator.init(iteratorPane);

            for (let i = 0; i < nodeObjs.length; i++) {
                // ? For performance issues this is here 
                if (!Parser.isNodeVisible(nodeObjs[i].node)) continue;

                for (let j = nodeObjs[i].matches.length - 1; j >= 0; j--) {
                    const match = nodeObjs[i].matches[j];
                    Iterator.appendNode(Highlighter.highlightTextNode(nodeObjs[i].node, match.startIndex, match.matchLength));
                }
            }
        }

        startDynamicSearch(query, matcherOptions, normalizerOptions, parserOptions, signal);
        UiSeter.updateSearchState(Constants.SEARCH_STATES.complete);
    } catch (error) {
        console.log("main > search", error);
        lastQuery = null;
        lastMatchType = null;
        UiSeter.updateSearchState(Constants.SEARCH_STATES.idle);
    }
}



function init() {
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        if (message.target === "tab") {
            switch (message.action) {
                case "search-current-page":

                    if (document.readyState === "loading") {
                        alert("Please let the page load");
                        return;
                    }

                    const selectedText = window.getSelection().toString();

                    if (!searchContainer) {
                        // ? Since the variables are already declared we have to use parantesis
                        // ? Name aliasing actualNameComing : newNameHere 
                        ({ input: searchInput, container: searchContainer, shadowRoot: shadowRoot, host: shadowRootHost, iteratorPane: iteratorPane } = await UiSeter.setupContainer(parserOptions, normalizerOptions, matcherOptions, optionsChangedObj, search));
                        interceptGlobalKeyEvents(shadowRootHost);
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

                        if (shadowRoot.activeElement === searchInput) {
                            searchContainer.style.display = "none";
                            search("");
                            return;
                        }

                        if (selectedText !== "") {
                            searchInput.value = selectedText;
                        }

                        searchInput.focus();
                        searchInput.select();

                        search(searchInput.value);
                    }
                    break;
                case "extension-off":
                    searchContainer.style.display = "none";
                    // ? remove hightlights and on going queries 
                    search("");
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


function interceptGlobalKeyEvents(shadowHostElement) {
    function blockHostKeybinds(e) {
        if (e.key === "Escape") return;
        // e.composedPath() returns the event's path, including your shadow host
        if (e.composedPath().includes(shadowHostElement)) {

            if (e.key === "Enter" && e.type === "keydown") {
                e.preventDefault(); // Stop native behaviors like form submission
                search(searchInput.value);
            }

            if (e.type === "keydown") {
                if (e.key === "ArrowUp") {
                    e.preventDefault(); // Prevent cursor jumping to start
                    Iterator.previous();
                } else if (e.key === "ArrowDown") {
                    e.preventDefault(); // Prevent cursor jumping to end
                    Iterator.next();
                }
            }


            // Stop the event from reaching the website's listeners
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }

    // The 'true' argument is critical. It forces your listener to run in the 
    // Capture Phase (top-down), beating the website's bubbling listeners.
    window.addEventListener('keydown', blockHostKeybinds, true);
    window.addEventListener('keyup', blockHostKeybinds, true);
    window.addEventListener('keypress', blockHostKeybinds, true); // * keypress is a deprecated event and also it is not supposed to fire on non-printable chars
    // ? Out input tag is getting the input because of the browser's behaviour of adding input when typed
    // ? This way the input event is also triggered
}

init();