import cssString from "./ui.css?raw";

// ! Need to add gif showing logic
export function setupContainer(parserOptions, normalizerOptions, matcherOptions, search) {
    const body = document.body;

    const host = document.createElement("div");
    host.id = "search-extension-host";
    host.style.position = "fixed";
    host.style.zIndex = "2147483647";

    const shadowRoot = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");

    // ! Do not add comments inside of this text it will cause errors
    style.textContent = cssString;
    shadowRoot.appendChild(style);

    let uiStates = {
        // * Three states idle, searching, searched
        searchState: "idle",
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

            search(input.value);
            return true;
        }
    });
    let regexFlagsAutoSetted = false;
    // 2. Proxy the main uiStates object
    // ! There is something serious going on with proxies!! They are making searching very slow when search mode is changed
    uiStates = new Proxy(uiStates, {
        set(target, prop, value) {
            Reflect.set(target, prop, value);

            // Map boolean toggles
            if (prop === 'matchCase') {
                normalizerOptions.caseInsensitive = !value
                search(input.value);
            };

            if (prop === 'matchWhole') {
                matcherOptions.matchWhole = value
                search(input.value);
            };



            // Map search types to matcherOptions.matchType
            const searchTypeMap = {
                normal: "Exact",
                regex: "RegEx",
                semantic: "Semantic",
                fuzzy: "Fuzzy",
                phonetic: "Phonetic"
            };



            if (searchTypeMap[prop]) {
                // ? This all comes under if value === true other wise it would have caused 6 search statements when chechbox.foreach logic would have ran
                if (value === true) {
                    matcherOptions.matchType = searchTypeMap[prop];
                    // ? When the user changes the mode the input should get refocused
                    input.focus();
                    
                    if (searchTypeMap[prop] === "Exact") {
                        search(input.value);
                    }
                    else {
                        // ? searching "" will remove current highlights and also stop current on going query
                        search("");
                        uiStates.searchState = "idle";
                    }

                    if (searchTypeMap[prop] === "RegEx") {
                        if (input.value === "") {
                            input.value = "//gm";
                            regexFlagsAutoSetted = true;
                            // ? Since the input is already focused we can use this otherwise we wouldn't have been able to use this
                            input.setSelectionRange(1, 1);
                        }
                    }
                    else {
                        if (regexFlagsAutoSetted && input.value === "//gm") {
                            input.value = "";
                            input.setSelectionRange(0, 0);
                        }
                    }

                }
            }

            // ? Refresh UI when some option has been changed
            refreshUi();

            return true;
        }
    });

    // 1. Create Main Container
    const container = document.createElement("div");
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

    const voiceRecBtn = document.createElement("div");
    voiceRecBtn.title = "Voice Search";
    voiceRecBtn.className = "input-btn";
    voiceRecBtn.id = "voice-rec-btn";
    voiceRecBtn.innerHTML = `<svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 14.2857C13.4229 14.2857 14.5714 13.1371 14.5714 11.7143V6.57143C14.5714 5.14857 13.4229 4 12 4C10.5771 4 9.42857 5.14857 9.42857 6.57143V11.7143C9.42857 13.1371 10.5771 14.2857 12 14.2857Z" fill="#c1c1d2"></path> <path d="M16.5429 11.7143H18C18 14.6371 15.6686 17.0543 12.8571 17.4743V20.2857H11.1429V17.4743C8.33143 17.0543 6 14.6371 6 11.7143H7.45714C7.45714 14.2857 9.63429 16.0857 12 16.0857C14.3657 16.0857 16.5429 14.2857 16.5429 11.7143Z" fill="#c1c1d2"></path> </g></svg>`

    voiceRecBtn.style.display = 'none';

    let debouncer = null;
    input.addEventListener("input", (e) => {
        const query = e.target.value;

        if (query === "") {
            // ? We should not wait in this case as sending this is supposed to remove highlights and not search for new matches
            search("");
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
        else {
            // ? When you are not in normal search mode then changing input should clear current highlights
            regexFlagsAutoSetted = false;
            search("");
        }

    });

    inputContainer.append(input, matchCaseBtn, matchWholeBtn, voiceRecBtn);

    // Toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "toolbar";


    // ? This is for the 1st search btn that will have 3 states
    const toolBtnSearch = document.createElement("div");
    toolBtnSearch.className = "tool-btn";
    // ? State 1
    const moveArrows = document.createElement("div");
    moveArrows.style.display = 'none';
    moveArrows.className = "move-arrows";
    moveArrows.innerHTML = `
        <svg id="up-arrow" title="Previous" class="arrow" width="25" height="15" viewBox="0 0 25 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 7C12.2652 7 12.5196 7.10536 12.7071 7.29289L19.7071 14.2929C20.0976 14.6834 20.0976 15.3166 19.7071 15.7071C19.3166 16.0976 18.6834 16.0976 18.2929 15.7071L12 9.41421L5.70711 15.7071C5.31658 16.0976 4.68342 16.0976 4.29289 15.7071C3.90237 15.3166 3.90237 14.6834 4.29289 14.2929L11.2929 7.29289C11.4804 7.10536 11.7348 7 12 7Z" fill="#c1c1d2"></path></svg>
        <svg id="down-arrow" title="Next" class="arrow" width="25" height="15" viewBox="0 0 25 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="#c1c1d2"></path></svg>
    `;
    toolBtnSearch.appendChild(moveArrows);

    // ? State 2:
    const loadingImg = document.createElement("img");
    loadingImg.title = "Searching...";
    loadingImg.src = chrome.runtime.getURL('assets/loading-circle.gif')

    loadingImg.classList.add("loading-circle");
    loadingImg.id = "loading-circle";
    loadingImg.style.display = 'none';
    toolBtnSearch.appendChild(loadingImg);

    // ? State 3: Default
    const searchSvgDiv = document.createElement("div");
    searchSvgDiv.title = "Search";
    searchSvgDiv.classList.add("expand-btn"); // ! You cannot add .rotate class to svg below this it will cause rotation

    searchSvgDiv.addEventListener("click", (e) => {
        console.log("clicked val: ", input.value);
        search(input.value);
    });

    const searchSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    searchSvg.setAttribute("width", "25");
    searchSvg.setAttribute("height", "25");
    searchSvg.setAttribute("viewBox", "0 0 25 25");
    searchSvg.setAttribute("fill", "none");

    searchSvg.innerHTML = `
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
        <path d="M14.9536 14.9458L21 21M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#c1c1d2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
    </g>
`;
    searchSvgDiv.appendChild(searchSvg)
    toolBtnSearch.appendChild(searchSvgDiv);

    const toolBtnExpand = document.createElement("div");
    toolBtnExpand.className = "tool-btn";
    const expandBtn = document.createElement("div");
    expandBtn.className = "expand-btn";
    expandBtn.title = "Expand";
    expandBtn.id = "expand-btn";
    expandBtn.innerHTML = `<svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 12L12 18L6 12" stroke="#c1c1d2" stroke-width="2"></path><path d="M18 6L12 12L6 6" stroke="#c1c1d2" stroke-width="2"></path></svg>`;
    toolBtnExpand.appendChild(expandBtn);

    toolbar.append(toolBtnSearch, toolBtnExpand);
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
        if (uiStates.expanded) expandBtn.title = "Collapse";
        else expandBtn.title = "Expand";
        expandBtnSvg.classList.toggle("rotate", uiStates.expanded);
        modesContainer.classList.toggle("opened", uiStates.expanded);
    });


    modeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('click', (e) => {
            if (uiStates[checkbox.name]) {
                // ? if checked checkbox is pressed than do not do anything
                e.preventDefault();
                return;
            }

            modeCheckboxes.forEach(cb => {
                if (cb.checked) {
                    // ? only false the one that is true
                    // ? otherwise it will unnecessaryly call proxy
                    cb.checked = false;
                    uiStates[cb.name] = false;
                }
            });

            checkbox.checked = true;
            uiStates[checkbox.name] = true;
        });
    });


    // ? Only goes for input buttons and search button states
    function refreshUi() {
        switch (uiStates.searchState) {
            case "idle":
                searchSvgDiv.style.display = "flex";
                loadingImg.style.display = "none";
                moveArrows.style.display = "none";
                break;
            case "searching":
                searchSvgDiv.style.display = "none";
                loadingImg.style.display = "flex";
                moveArrows.style.display = "none";
                break;
            case "searched":
                searchSvgDiv.style.display = "none";
                loadingImg.style.display = "none";
                moveArrows.style.display = "flex";
                break;
        }

        if (uiStates.normal) {
            matchCaseBtn.style.display = "flex";
            matchWholeBtn.style.display = "flex";
        }
        else {
            matchCaseBtn.style.display = "none";
            matchWholeBtn.style.display = "none";
        }

        if (uiStates.phonetic) {
            voiceRecBtn.style.display = "flex";
        }
        else {
            voiceRecBtn.style.display = "none";
        }
    }

    return { input, container };
}