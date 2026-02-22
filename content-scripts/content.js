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
    let searchLoader = null;
    let controller = null;
    let searchRequestId = 0;

    async function search(query) {
        if (controller) controller.abort();

        controller = new AbortController();
        const signal = controller.signal;
        const requestId = ++searchRequestId;

        if (searchLoader) searchLoader.classList.add("is-visible");
        
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
        } finally {
            if (requestId === searchRequestId && searchLoader) {
                searchLoader.classList.remove("is-visible");
            }
        }
    }

    // ! For UDAYNOOR
    // ? You can add your logic here
    function setupContainer() {
        const body = document.body;
        const uiState = {
            showAdvanced: false,
            optionsOpen: false,
            caseSensitive: false,
            exactSearch: false,
            searchArea: {
                main: true,
                nav: false,
                code: false
            },
            semantic: false,
            phonetic: false,
            regex: false,
            fuzzy: false
        };

        searchContainer = document.createElement("div");
        searchContainer.classList.add("s-search-container");
        searchContainer.setAttribute("role", "dialog");
        searchContainer.setAttribute("aria-label", "Search toolbox");

        const toolbar = document.createElement("div");
        toolbar.classList.add("s-search-toolbar");

        const dragHandle = document.createElement("button");
        dragHandle.type = "button";
        dragHandle.classList.add("s-drag-handle");
        dragHandle.textContent = "::";
        dragHandle.title = "Drag search bar";

        searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.classList.add("s-search-input");
        searchInput.placeholder = "Search in this page";

        const actionButton = document.createElement("button");
        actionButton.type = "button";
        actionButton.classList.add("s-toolbar-btn");
        actionButton.textContent = "Go";
        actionButton.title = "Start search";

        searchLoader = document.createElement("span");
        searchLoader.classList.add("s-search-loader");
        searchLoader.setAttribute("aria-hidden", "true");

        const expandButton = document.createElement("button");
        expandButton.type = "button";
        expandButton.classList.add("s-toolbar-btn", "s-expand-btn");
        expandButton.textContent = "v";
        expandButton.title = "Show advanced options";

        const extraControls = document.createElement("div");
        extraControls.classList.add("s-extra-controls");

        const caseButton = document.createElement("button");
        caseButton.type = "button";
        caseButton.classList.add("s-toolbar-btn", "s-extra-btn");
        caseButton.textContent = "Aa";
        caseButton.title = "Toggle case-sensitive search";

        const exactButton = document.createElement("button");
        exactButton.type = "button";
        exactButton.classList.add("s-toolbar-btn", "s-extra-btn");
        exactButton.textContent = "S";
        exactButton.title = "Toggle exact matching";

        extraControls.appendChild(caseButton);
        extraControls.appendChild(exactButton);

        const optionsPanel = document.createElement("div");
        optionsPanel.classList.add("s-options-panel");

        function addOptionRow(label, key, group, onChange) {
            const row = document.createElement("label");
            row.classList.add("s-option-row");

            const text = document.createElement("span");
            text.classList.add("s-option-label");
            text.textContent = label;

            const input = document.createElement("input");
            input.type = "checkbox";
            input.classList.add("s-option-check");
            input.checked = !!group[key];
            input.addEventListener("change", () => {
                group[key] = input.checked;
                if (onChange) onChange(input.checked, input);
            });

            row.appendChild(text);
            row.appendChild(input);
            return row;
        }

        const scopeGroup = document.createElement("div");
        scopeGroup.classList.add("s-scope-group");
        scopeGroup.appendChild(addOptionRow("Main", "main", uiState.searchArea));
        scopeGroup.appendChild(addOptionRow("Nav", "nav", uiState.searchArea));
        scopeGroup.appendChild(addOptionRow("Code", "code", uiState.searchArea));
        optionsPanel.appendChild(scopeGroup);

        const featureRows = [
            ["Semantic", "semantic"],
            ["Phonetic", "phonetic"],
            ["Regex", "regex"],
            ["Fuzzy", "fuzzy"]
        ];
        const featureInputs = {};

        featureRows.forEach(([label, key]) => {
            const row = addOptionRow(label, key, uiState, (isChecked) => {
                if (!isChecked) return;
                featureRows.forEach(([, otherKey]) => {
                    if (otherKey === key) return;
                    uiState[otherKey] = false;
                    if (featureInputs[otherKey]) {
                        featureInputs[otherKey].checked = false;
                    }
                });
            });
            featureInputs[key] = row.querySelector(".s-option-check");
            optionsPanel.appendChild(row);
        });

        toolbar.appendChild(dragHandle);
        toolbar.appendChild(searchInput);
        toolbar.appendChild(actionButton);
        toolbar.appendChild(searchLoader);
        toolbar.appendChild(expandButton);
        toolbar.appendChild(extraControls);

        searchContainer.appendChild(toolbar);
        searchContainer.appendChild(optionsPanel);

        body.prepend(searchContainer);

        function refreshUiState() {
            const hasQuery = searchInput.value.trim().length > 0;
            actionButton.style.display = hasQuery ? "none" : "inline-flex";
            expandButton.style.display = hasQuery ? "inline-flex" : "none";

            if (!hasQuery) {
                uiState.showAdvanced = false;
                uiState.optionsOpen = false;
            }

            extraControls.style.display = uiState.showAdvanced ? "inline-flex" : "none";
            optionsPanel.style.display = uiState.optionsOpen ? "block" : "none";
            expandButton.textContent = uiState.optionsOpen ? "^" : "v";

            caseButton.classList.toggle("is-active", uiState.caseSensitive);
            exactButton.classList.toggle("is-active", uiState.exactSearch);
        }

        let debounceTimer;
        searchInput.addEventListener("input", (e) => {
            clearTimeout(debounceTimer);
            refreshUiState();
            debounceTimer = setTimeout(() => {
                search(e.target.value);
            }, 200);
        });

        actionButton.addEventListener("click", () => {
            search(searchInput.value);
        });

        expandButton.addEventListener("click", () => {
            if (!uiState.showAdvanced) {
                uiState.showAdvanced = true;
                uiState.optionsOpen = true;
            } else {
                uiState.optionsOpen = !uiState.optionsOpen;
            }
            refreshUiState();
        });

        caseButton.addEventListener("click", () => {
            uiState.caseSensitive = !uiState.caseSensitive;
            refreshUiState();
        });

        exactButton.addEventListener("click", () => {
            uiState.exactSearch = !uiState.exactSearch;
            refreshUiState();
        });

        searchInput.addEventListener("click", () => {
            const hasQuery = searchInput.value.trim().length > 0;
            if (!hasQuery) return;

            if (!uiState.showAdvanced) {
                uiState.showAdvanced = true;
                uiState.optionsOpen = true;
                refreshUiState();
            }
        });

        // Drag behavior anchored to the handle, then keep the bar fixed at new coordinates.
        let isDragging = false;
        let pointerId = null;
        let startX = 0;
        let startY = 0;
        let originLeft = 0;
        let originTop = 0;

        dragHandle.addEventListener("pointerdown", (event) => {
            isDragging = true;
            pointerId = event.pointerId;
            dragHandle.setPointerCapture(pointerId);

            const rect = searchContainer.getBoundingClientRect();
            originLeft = rect.left;
            originTop = rect.top;
            startX = event.clientX;
            startY = event.clientY;

            searchContainer.style.left = rect.left + "px";
            searchContainer.style.top = rect.top + "px";
            searchContainer.style.right = "auto";
            searchContainer.classList.add("is-dragging");
            event.preventDefault();
        });

        dragHandle.addEventListener("pointermove", (event) => {
            if (!isDragging || event.pointerId !== pointerId) return;

            const deltaX = event.clientX - startX;
            const deltaY = event.clientY - startY;
            const maxLeft = window.innerWidth - searchContainer.offsetWidth;
            const maxTop = window.innerHeight - searchContainer.offsetHeight;
            const nextLeft = Math.min(Math.max(6, originLeft + deltaX), Math.max(6, maxLeft - 6));
            const nextTop = Math.min(Math.max(6, originTop + deltaY), Math.max(6, maxTop - 6));

            searchContainer.style.left = nextLeft + "px";
            searchContainer.style.top = nextTop + "px";
        });

        function stopDragging(event) {
            if (!isDragging || event.pointerId !== pointerId) return;
            isDragging = false;
            pointerId = null;
            searchContainer.classList.remove("is-dragging");
            dragHandle.releasePointerCapture(event.pointerId);
        }

        dragHandle.addEventListener("pointerup", stopDragging);
        dragHandle.addEventListener("pointercancel", stopDragging);

        document.addEventListener("mousedown", (event) => {
            if (!searchContainer || searchContainer.style.display === "none") return;
            if (!searchContainer.contains(event.target)) {
                uiState.optionsOpen = false;
                refreshUiState();
            }
        });

        refreshUiState();
        searchInput.focus();
    }

    function init() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.for === "search-current-page") {
                if (!searchContainer) {
                    setupContainer();
                } else if (searchContainer.style.display === "none") {
                    searchContainer.style.display = "block";
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
