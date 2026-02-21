// * Project uses Revealing Module Pattern
// ! Look out for cyclic dependancies!!
// ? There will be cyclic dependancy if manifest.json loads this file before other files have loaded. 
'use strict';

// ? These comments tell vs code that these files both share same environment
/// <reference path="./core/initializer.js" />
/// <reference path="./core/constants.js" />
/// <reference path="./core/parser.js" />
/// <reference path="./core/normalizer.js" />
/// <reference path="./core/highlighter.js" />


// ? Reveal Modules by passing reference to IIFEs
SearchExt.Content = (function (Parser, Highlighter) {

    let searchContainer = null;
    let searchInput = null;
    let controller = null;

    async function search(query) {
        if (controller) controller.abort();

        controller = new AbortController();
        const signal = controller.signal;
        
        signal.addEventListener('abort', () => {
            console.log('Aborted with reason:', signal.reason);
            Highlighter.clearHighlights();
        });

        try {
            if (!query.trim()) Highlighter.clearHighlights();
            else {

                const nodes = Parser.getVisibleTextNodes();



            }

            if (signal.aborted) return;
            console.log("tried searching " + query + ". Aborted");
        } catch (error) {
            console.error(error);
        }
    }

    // ! For UDAYNOOR
    // ? You can add your logic here
    function setupContainer() {
        const body = document.body;
        searchContainer = document.createElement("div");
        searchContainer.classList.add("s-search-container");

        searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.classList.add("s-search-input");

        searchContainer.appendChild(searchInput);
        body.prepend(searchContainer);

        let debounceTimer;
        searchInput.addEventListener("input", (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                search(e.target.value);
            }, 200);
        });

        searchInput.focus();
    }

    function init() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.for === "search-current-page") {
                if (!searchContainer) {
                    setupContainer();
                } else if (searchContainer.style.display === "none") {
                    searchContainer.style.display = "flex";
                    searchInput.focus();
                    searchInput.select();
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
            }
        });
    }

    return { init };
})(SearchExt.Parser, SearchExt.Highlighter);


SearchExt.Content.init();