// * Project uses Revealing Module Pattern
// ! Look out for cyclic dependancies!!
// ? There will be cyclic dependancy if manifest.json loads this file before other files have loaded. 
'use strict';

// ? These comments tell vs code that these files both share same environment
/// <reference path="./initializer.js" />
/// <reference path="./core/constants.js" />
/// <reference path="./core/parser.js" />
/// <reference path="./core/normalizer.js" />
/// <reference path="./core/matcher.js" />
/// <reference path="./core/highlighter.js" />


// ? Reveal Modules by passing reference to IIFEs
SearchExt.Content = (function (Parser, Normalizer, Matcher, Highlighter) {

    let searchContainer = null;
    let searchInput = null;
    let controller = null;

    // ! Remember if you add a new object here and in uiStates you have to bridge them by proxy in uiStates
    const normalizerOptions = { removeDiacritics: true, caseInsensitive: true };
    const parserOptions = { includeMain: true, includeNav: true, includeCode: true };
    // ? possible searchTypes "Exact", "RegEx", "Semantic", "Fuzzy", "Phonetic" 
    const matcherOptions = { matchType: "Exact", matchWhole: false }

    async function search(query) {
        if (controller) controller.abort();

        controller = new AbortController();
        const signal = controller.signal;

        signal.addEventListener('abort', () => {
            console.log("cleared the prev query highlights: " + query);
            Highlighter.clearHighlights();
        });

        try {
            if (!query.trim()) {
                return;
                // Highlighter.clearHighlights();
            }
            else {
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
                    for (let j = 0; j < nodeObjs[i].matches.length; j++) {
                        const match = nodeObjs[i].matches[j];
                        Highlighter.highlightTextNode(nodeObjs[i].node, match.startIndex, match.matchLength);
                    }
                }
            }
            // if (signal.aborted) return;
            // console.log("tried searching " + query + ". Aborted");
        } catch (error) {
            console.error(error);
        }
    }


    // ! Need to add gif showing logic
    function setupContainer() {
        const body = document.body;

        const host = document.createElement("div");
        host.id = "search-extension-host";
        host.style.position = "fixed";
        host.style.zIndex = "2147483647";

        const shadowRoot = host.attachShadow({ mode: "closed" });
        const style = document.createElement("style");

        style.textContent = `
:host {
    --gothic-black: #0e0e12;
    --gothic-darkest: #1a1a24;
    --gothic-darker: #333346;
    --gothic-dark: #535373;
    --gothic-light: #8080a4;
    --gothic-lighter: #a6a6bf;
    --gothic-lightest: #c1c1d2;
    --gothic-white: #e6e6ec;
}

* {
    box-sizing: border-box;
    outline: none;
    border: none;
} 

input {
    background-color: transparent;
}

input[type="checkbox"] {
    appearance: none;
    cursor: pointer;
    width: 14px;
    height: 14px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 4px;
    border: 1px solid var(--gothic-lighter);
    background-color: var(--gothic-light);
}

input[type="checkbox"]:checked {
    background-color: var(--gothic-dark);
    /* Your active color */
}

/* Add a custom checkmark icon */
input[type="checkbox"]:checked::after {
    content: '✔';
    color: var(--gothic-white);
    font-size: 10px;
}


.search-container {
    position: fixed;
    width: fit-content;
    height: 50px;
    display: flex;
    flex-direction: row;
    border-radius: 8px;
    /* padding: 5px 5px 5px 0; */
    background-color: var(--gothic-darker);
    z-index: 2147483647;

    top: 5%;
    left: 60%;
}

.search-panel {
    width: fit-content;
    height: 100%;
    display: flex;
    border-radius: 8px;
    padding: 5px 5px 5px 0;
    background-color: var(--gothic-darker);
    z-index: 10;;
}


.drag-handle {
    width: fit-content;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
}

.drag-handle.grabbed {
    cursor: grabbing;
}


.input-container {
    height: 100%;
    width: 300px;
    display: flex;
    align-items: center;
    /* justify-content: center; */
    gap: 5px;
    border-radius: 4px;
    background-color: var(--gothic-darkest);
}

.input {
    height: 100%;
    padding: 5px 0px 5px 10px;
    font-size: medium;
    color: var(--gothic-lightest);
    flex: 1;
}

.input-btn {
    width: 30px;
    height: 30px;
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    transition: background-color 0.25s ease-in-out;
}

.input-btn:hover {
    background-color: var(--gothic-darker);
}

.input-btn.active {
    background-color: var(--gothic-dark);
}

.input-btn.active:hover {
    background-color: var(--gothic-dark);
}

.input-btn:last-of-type {
    margin-right: 10px;
}

.modes-container {
    position: absolute;
}


.toolbar {
    height: 100%;
    width: fit-content;
    display: flex;
    /* justify-content: center; */
    align-items: center;
    gap: 5px;
    margin-left: 5px;
}

.tool-btn {
    width: 40px;
    height: 100%;
    border-radius: 4px;
    background-color: var(--gothic-darkest);
    display: flex;
    align-items: center;
    justify-content: center;
}

.tool-btn .move-arrows {
    height: 100%;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.move-arrows .arrow {
    transition: background-color 0.25s ease-in-out;
}

.move-arrows .arrow:hover {
    cursor: pointer;
    border-radius: 4px;
    background-color: var(--gothic-darker);
}


.expand-btn {
    width: 30px;
    height: 30px;
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transform: rotate(0deg);

    transition: background-color 0.25s ease-in-out,
    transform 0.3s ease-in-out;
}

.expand-btn > svg{
    transform: rotate(0deg);
    transition: transform 0.3s ease-in-out;
}

.expand-btn > svg.rotate {
    transform: rotate(-180deg);
}

.expand-btn:hover {
    background-color: var(--gothic-darker);
}

.loading-circle {
    height: 40px;
    width: auto;
    aspect-ratio: initial;
    filter: invert(85%) sepia(10%) saturate(550%) hue-rotate(195deg) brightness(92%) contrast(88%);
}



.modes-container {
    position: absolute;
    top: 0;
    height: 0px;
    width: 100%;
    display: flex;

    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    padding: 5px 10px 5px 10px;
    background-color: var(--gothic-lightest);
    color: var(--gothic-darkest);

    user-select: none;

    transition: top 0.3s ease-in-out,
        height 0.3s ease-in-out;
    overflow: hidden;
}

.modes-container.opened {
    top: 60px;
    /* ! Hard coded height that would be obtained on fit-content */
    height: 180px;
}

.area-tags {
    display: flex;
    width: 100%;
    height: 40px;
    gap: 20px;
    border-bottom: 2px solid var(--gothic-light);
}

.area-tags .tag {
    display: flex;
    align-items: center;
    width: fit-content;
    height: 100%;
    gap: 10px;
}

.modes {
    width: 100%;
    height: fit-content;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 10px 0 10px 0;
}

.mode {
    width: 100%;
    display: flex;
}

.mode-name {
    margin-right: auto;
}
    `;
        shadowRoot.appendChild(style);

        let uiStates = {
            expanded: false,
            matchCase: false,
            matchWhole: false,
            searchArea: {
                main: true,
                nav: true,
                code: true
            },
            normal: true,
            semantic: false,
            phonetic: false,
            regex: false,
            fuzzy: false
        };

        // 1. Proxy the nested searchArea object
        uiStates.searchArea = new Proxy(uiStates.searchArea, {
            set(target, prop, value) {
                Reflect.set(target, prop, value);

                // Map searchArea properties to parserOptions
                const parserMap = { main: 'includeMain', nav: 'includeNav', code: 'includeCode' };
                if (parserMap[prop]) parserOptions[parserMap[prop]] = value;

                return true;
            }
        });

        // 2. Proxy the main uiStates object
        uiStates = new Proxy(uiStates, {
            set(target, prop, value) {
                Reflect.set(target, prop, value);

                // Map boolean toggles
                if (prop === 'matchCase') normalizerOptions.caseInsensitive = !value;
                if (prop === 'matchWhole') matcherOptions.matchWhole = value;

                // Map search types to matcherOptions.matchType
                const searchTypeMap = {
                    normal: "Exact",
                    regex: "RegEx",
                    semantic: "Semantic",
                    fuzzy: "Fuzzy",
                    phonetic: "Phonetic"
                };

                if (searchTypeMap[prop] && value === true) {
                    matcherOptions.matchType = searchTypeMap[prop];
                }

                return true;
            }
        });

        // 1. Create Main Container
        const container = document.createElement("div");
        searchContainer = container;
        container.className = "search-container";
        container.id = "search-container";

        // 2. Create Search Panel
        const searchPanel = document.createElement("div");
        searchPanel.className = "search-panel";

        // Drag Handle
        const dragHandle = document.createElement("div");
        dragHandle.title = "Drag";
        dragHandle.className = "drag-handle";
        dragHandle.id = "drag-handle";
        dragHandle.innerHTML = `<svg fill="#a6a6bf" width="25" height="25" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg"><g stroke-width="0"></g><g stroke-linecap="round" stroke-linejoin="round"></g><g><path d="M686.211 137.143v-.137l68.572.137H686.21Zm0 1508.571c75.566 0 137.143 61.577 137.143 137.143S761.777 1920 686.211 1920c-75.702 0-137.142-61.577-137.142-137.143s61.44-137.143 137.142-137.143Zm548.572 0c75.566 0 137.143 61.577 137.143 137.143S1310.349 1920 1234.783 1920c-75.703 0-137.143-61.577-137.143-137.143s61.44-137.143 137.143-137.143ZM686.21 1097.143c75.566 0 137.143 61.577 137.143 137.143 0 75.565-61.577 137.143-137.143 137.143-75.702 0-137.142-61.578-137.142-137.143 0-75.566 61.44-137.143 137.142-137.143Zm548.572 0c75.566 0 137.143 61.577 137.143 137.143 0 75.565-61.577 137.143-137.143 137.143-75.703 0-137.143-61.578-137.143-137.143 0-75.566 61.44-137.143 137.143-137.143ZM686.21 548.57c75.566 0 137.143 61.578 137.143 137.143 0 75.566-61.577 137.143-137.143 137.143-75.702 0-137.142-61.577-137.142-137.143 0-75.565 61.44-137.143 137.142-137.143Zm548.572 0c75.566 0 137.143 61.578 137.143 137.143 0 75.566-61.577 137.143-137.143 137.143-75.703 0-137.143-61.577-137.143-137.143 0-75.565 61.44-137.143 137.143-137.143ZM686.21 0c75.566 0 137.143 61.577 137.143 137.143S761.776 274.286 686.21 274.286c-75.702 0-137.142-61.577-137.142-137.143S610.509 0 686.21 0Zm548.503 0c75.566 0 137.143 61.577 137.143 137.143s-61.577 137.143-137.143 137.143c-75.565 0-137.143-61.577-137.143-137.143S1159.15 0 1234.714 0Z" fill-rule="evenodd"></path></g></svg>`;

        // Input Container
        const inputContainer = document.createElement("div");
        inputContainer.className = "input-container";

        const input = document.createElement("input");
        searchInput = input;

        input.type = "text";
        input.className = "input";

        const matchCaseBtn = document.createElement("div");
        matchCaseBtn.title = "Match Case";
        matchCaseBtn.className = "input-btn";
        matchCaseBtn.id = "match-case-btn";
        matchCaseBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24"><path fill="#c1c1d2" d="m3.975 17l3.75-10h1.8l3.75 10H11.55l-.9-2.55H6.6L5.7 17H3.975Zm3.15-4h3l-1.45-4.15h-.1L7.125 13Zm9.225 4.275q-1.225 0-1.925-.638t-.7-1.737q0-1.05.813-1.713t2.087-.662q.575 0 1.063.088t.837.287v-.35q0-.675-.462-1.075t-1.263-.4q-.525 0-.988.225t-.787.65l-1.075-.8q.475-.675 1.2-1.025t1.675-.35q1.55 0 2.375.738t.825 2.137v4.4H18.55v-.85h-.075q-.325.5-.875.788t-1.25.287Zm.25-1.25q.8 0 1.363-.563t.562-1.362q-.35-.2-.8-.3t-.825-.1q-.8 0-1.225.313t-.425.887q0 .5.375.813t.975.312Z" /></svg>`;

        const matchWholeBtn = document.createElement("div");
        matchWholeBtn.title = "Match Whole Word";
        matchWholeBtn.className = "input-btn";
        matchWholeBtn.id = "match-whole-btn";
        matchWholeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24"><path fill="#c1c1d2" d="M3 19.025q-.825 0-1.413-.587T1 17.025v-2q0-.425.288-.712T2 14.025q.425 0 .713.288t.287.712v2h18v-2q0-.425.288-.713t.712-.287q.425 0 .713.288t.287.712v2q0 .825-.588 1.413T21 19.024H3Zm4.35-3.8q-1.225 0-1.925-.637t-.7-1.738q0-1.05.813-1.712t2.087-.663q.575 0 1.063.088t.837.287v-.35q0-.675-.463-1.075t-1.262-.4q-.375 0-.712.113t-.613.312q-.225.175-.487.2T5.5 9.5q-.225-.175-.275-.438t.15-.462q.45-.425 1.063-.65t1.387-.225q1.55 0 2.375.738t.825 2.137v3.675q0 .3-.213.513T10.3 15q-.325 0-.537-.213t-.213-.537v-.1h-.075q-.325.5-.875.788t-1.25.287Zm.55-3.575q-.8 0-1.225.313t-.425.887q0 .5.375.813t.975.312q.8 0 1.363-.562t.562-1.363q-.35-.2-.8-.3t-.825-.1Zm8.425 3.575q-1.025 0-1.562-.45t-.688-.7H14v.325q0 .3-.212.513t-.513.212q-.3 0-.525-.225t-.225-.525V5.75q0-.325.225-.55t.55-.225q.325 0 .55.225t.225.55V7.8L14 8.8h.075q.075-.125.6-.638t1.65-.512q1.6 0 2.525 1.15t.925 2.65q0 1.5-.912 2.638t-2.538 1.137ZM16.1 9.05q-1 0-1.55.738T14 11.425q0 .925.55 1.65t1.55.725q1 0 1.563-.725t.562-1.65q0-.925-.563-1.65T16.1 9.05Z" /></svg>`;

        let debouncer = null;
        input.addEventListener("input", (e) => {
            const query = e.target.value;
            if (query === "") {
                // ? We should not wait in this case as sending this is supposed to remove highlights and not search for new matches
                search(query);
                return; 
            }
            if (uiStates.normal) {
                if (debouncer) {
                    clearTimeout(debouncer);
                    debouncer = null;
                }
                debouncer = setTimeout(() => {
                    search(query);
                }, 300);
            }
        });

        inputContainer.append(input, matchCaseBtn, matchWholeBtn);

        // Toolbar
        const toolbar = document.createElement("div");
        toolbar.className = "toolbar";

        const toolBtnArrows = document.createElement("div");
        toolBtnArrows.className = "tool-btn";
        const moveArrows = document.createElement("div");
        moveArrows.className = "move-arrows";
        moveArrows.innerHTML = `
        <svg id="up-arrow" class="arrow" width="25" height="15" viewBox="0 0 25 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 7C12.2652 7 12.5196 7.10536 12.7071 7.29289L19.7071 14.2929C20.0976 14.6834 20.0976 15.3166 19.7071 15.7071C19.3166 16.0976 18.6834 16.0976 18.2929 15.7071L12 9.41421L5.70711 15.7071C5.31658 16.0976 4.68342 16.0976 4.29289 15.7071C3.90237 15.3166 3.90237 14.6834 4.29289 14.2929L11.2929 7.29289C11.4804 7.10536 11.7348 7 12 7Z" fill="#c1c1d2"></path></svg>
        <svg id="down-arrow" class="arrow" width="25" height="15" viewBox="0 0 25 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="#c1c1d2"></path></svg>
    `;
        toolBtnArrows.appendChild(moveArrows);

        const toolBtnExpand = document.createElement("div");
        toolBtnExpand.className = "tool-btn";
        const expandBtn = document.createElement("div");
        expandBtn.className = "expand-btn";
        expandBtn.id = "expand-btn";
        expandBtn.innerHTML = `<svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 12L12 18L6 12" stroke="#c1c1d2" stroke-width="2"></path><path d="M18 6L12 12L6 6" stroke="#c1c1d2" stroke-width="2"></path></svg>`;
        toolBtnExpand.appendChild(expandBtn);

        toolbar.append(toolBtnArrows, toolBtnExpand);
        searchPanel.append(dragHandle, inputContainer, toolbar);

        // 3. Create Modes Container
        const modesContainer = document.createElement("div");
        modesContainer.className = "modes-container";

        const areaTags = document.createElement("div");
        areaTags.className = "area-tags";

        const modes = document.createElement("div");
        modes.className = "modes";

        // Helper function for checkboxes
        function createCheckbox(parent, wrapperClass, labelClass, labelText, inputName, isChecked, onChange) {
            const wrapper = document.createElement("div");
            wrapper.className = wrapperClass;

            const nameDiv = document.createElement("div");
            nameDiv.className = labelClass;
            nameDiv.textContent = labelText;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            if (inputName) checkbox.name = inputName;
            checkbox.checked = isChecked;
            if (onChange) checkbox.addEventListener('change', onChange);

            wrapper.append(nameDiv, checkbox);
            parent.appendChild(wrapper);
            return checkbox;
        }

        // Add Area Tags
        createCheckbox(areaTags, "tag", "tag-name", "Main", "", uiStates.searchArea.main, (e) => uiStates.searchArea.main = e.target.checked);
        createCheckbox(areaTags, "tag", "tag-name", "Nav", "", uiStates.searchArea.nav, (e) => uiStates.searchArea.nav = e.target.checked);
        createCheckbox(areaTags, "tag", "tag-name", "Code", "", uiStates.searchArea.code, (e) => uiStates.searchArea.code = e.target.checked);

        // Add Modes
        const modeConfigs = [
            { name: "normal", label: "Normal" },
            { name: "regex", label: "RegEx" },
            { name: "fuzzy", label: "Fuzzy" },
            { name: "semantic", label: "Semantic" },
            { name: "phonetic", label: "Phonetic" }
        ];

        const modeCheckboxes = modeConfigs.map(config => {
            return createCheckbox(modes, "mode", "mode-name", config.label, config.name, uiStates[config.name]);
        });

        modesContainer.append(areaTags, modes);
        container.append(searchPanel, modesContainer);
        shadowRoot.appendChild(container);
        body.prepend(host);

        // 4. Attach Event Listeners
        let isDragging = false, offsetX, offsetY;

        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = container.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            dragHandle.classList.add("grabbed");
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            container.style.left = `${e.clientX - offsetX}px`;
            container.style.top = `${e.clientY - offsetY}px`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            dragHandle.classList.remove("grabbed");
        });

        matchCaseBtn.addEventListener("click", (e) => {
            uiStates.matchCase = !uiStates.matchCase;
            e.currentTarget.classList.toggle("active", uiStates.matchCase);
        });

        matchWholeBtn.addEventListener("click", (e) => {
            uiStates.matchWhole = !uiStates.matchWhole;
            e.currentTarget.classList.toggle("active", uiStates.matchWhole);
        });

        const expandBtnSvg = expandBtn.querySelector("svg");
        expandBtn.addEventListener("click", () => {
            uiStates.expanded = !uiStates.expanded;
            expandBtnSvg.classList.toggle("rotate", uiStates.expanded);
            modesContainer.classList.toggle("opened", uiStates.expanded);
        });


        modeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                if (uiStates[checkbox.name]) {
                    e.preventDefault();
                    return;
                }

                modeCheckboxes.forEach(cb => {
                    cb.checked = false;
                    uiStates[cb.name] = false;
                });

                checkbox.checked = true;
                uiStates[checkbox.name] = true;
            });
        });
    }

    function init() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.for === "search-current-page") {
                if (!searchContainer) {
                    setupContainer();
                    searchInput.focus();
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
})(SearchExt.Parser, SearchExt.Normalizer, SearchExt.Matcher, SearchExt.Highlighter);


SearchExt.Content.init();