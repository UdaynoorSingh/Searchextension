import * as Constants from "../_lib/constants.js";
import panelCssString from "./panel.css?raw";
import cssString from "./ui.css?raw";

import { CornerMessage } from "./panel.js";
import * as Iterator from "../core/iterator.js";
import { getPreference } from "../_lib/utils.js";

export let updateSearchState = null;


export async function setupContainer(parserOptions, normalizerOptions, matcherOptions, optionsChangedObj, search) {
    const body = document.body;

    const host = document.createElement("div");
    host.id = "search-extension-host";
    host.style.position = "fixed";
    host.style.zIndex = "2147483647";

    const shadowRoot = host.attachShadow({ mode: "closed" });

    const isDev = await getPreference("isDev");

    const style = document.createElement("style");


    style.textContent = cssString + panelCssString;
    shadowRoot.appendChild(style);


    let uiStates = {
        expanded: false,
        matchCase: false,
        matchWhole: false,
        matchDiacritics: false,
        searchArea: {
            main: false,
            nav: false,
            code: false
        },
        normal: false,
        phonetic: false,
        regex: false,
        fuzzy: false
    };


    // 1. Proxy the nested searchArea object
    uiStates.searchArea = new Proxy(uiStates.searchArea, {
        set(target, prop, value) {
            Reflect.set(target, prop, value);
            input.focus(); // ? When some prop changes user most likely wants to iterate this is purely for keyboard users so that they can instantly use their keyboard after changing an option
            optionsChangedObj.optionsChanged = true;

            // Map searchArea properties to parserOptions
            const parserMap = { main: 'includeMain', nav: 'includeNav', code: 'includeCode' };
            if (parserMap[prop]) parserOptions[parserMap[prop]] = value;

            if (prop === "main") chrome.storage.local.set({ lastMain: value });
            else if (prop === "nav") chrome.storage.local.set({ lastNav: value });
            else if (prop === "code") chrome.storage.local.set({ lastCode: value });


            search(input.value);
            return true;
        }
    });
    let regexAutoSetted = false;
    // 2. Proxy the main uiStates object

    uiStates = new Proxy(uiStates, {
        set(target, prop, value) {
            Reflect.set(target, prop, value);
            input.focus(); // ? When some prop changes user most likely wants to iterate this is purely for keyboard users so that they can instantly use their keyboard after changing an option
            optionsChangedObj.optionsChanged = true;

            // Map boolean toggles
            if (prop === 'matchCase') {
                normalizerOptions.caseInsensitive = !value

                chrome.storage.local.set({ lastMatchCase: value });
                search(input.value);
            };

            if (prop === 'matchWhole') {
                matcherOptions.matchWhole = value
                chrome.storage.local.set({ lastMatchWhole: value });
                search(input.value);
            };

            if (prop === 'matchDiacritics') {
                normalizerOptions.matchDiacritics = value
                chrome.storage.local.set({ lastMatchDiacritics: value });
                search(input.value);
            };



            // Map search types to matcherOptions.matchType
            const searchTypeMap = {
                normal: "Exact",
                regex: "RegEx",
                fuzzy: "Fuzzy",
                phonetic: "Phonetic"
            };



            if (searchTypeMap[prop]) {
                // ? This all comes under if value === true other wise it would have caused 6 search statements when chechbox.foreach logic would have ran
                if (value === true) {

                    chrome.storage.local.set({ lastMode: prop });

                    const inputVal = input.value;

                    matcherOptions.matchType = searchTypeMap[prop];
                    // ? When the user changes the mode the input should get refocused
                    input.focus();
                    search(input.value);

                    if (searchTypeMap[prop] === "RegEx") {
                        // ? if text is not of the form auto add wrapper
                        if (!(/^\/.*\/[dgimsuyv]*$/.test(inputVal))) {

                            input.value = '/' + inputVal + '/gm';
                            regexAutoSetted = true;
                            // ? Since the input is already focused we can use this otherwise we wouldn't have been able to use this
                            input.setSelectionRange(inputVal.length + 1, inputVal.length + 1);
                        }
                    }
                    else {
                        if (regexAutoSetted && (/^\/.*\/[gm]*$/.test(inputVal))) {
                            // ? Removing //gm
                            input.value = inputVal.match(/^\/(.*)\/[gm]*$/)[1];
                            input.setSelectionRange(inputVal.length - 3, inputVal.length - 3);
                            regexAutoSetted = false;

                        }
                    }


                    // ? Stuff like searching should always happen at the end
                    if (searchTypeMap[prop] === "Exact") {
                        input.spellcheck = true;
                    }
                    else {
                        // ? searching "" will remove current highlights and also stop current on going query
                        input.spellcheck = false;
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

    const iteratorPane = document.createElement("div");
    iteratorPane.classList.add("iterator-pane");

    const iteratorPaneInput = document.createElement("input");
    iteratorPaneInput.classList.add("iterator-pane-input");
    const iteratorPaneMiddleSlash = document.createTextNode("/");
    const iteratorPaneResult = document.createElement("span");
    iteratorPaneResult.innerText = "1234";
    iteratorPaneResult.classList.add("iterator-pane-result");


    iteratorPane.append(iteratorPaneInput, iteratorPaneMiddleSlash, iteratorPaneResult);


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


    const lastMatchCase = await getPreference("lastMatchCase");
    const lastMatchWhole = await getPreference("lastMatchWhole");
    const lastMatchDiacritics = await getPreference("lastMatchDiacritics");


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



    const showMatchDiacritics = await getPreference("showMatchDiacritics");

    const matchDiacriticsBtn = document.createElement("div");
    matchDiacriticsBtn.title = "Match Diacritics";
    matchDiacriticsBtn.className = "input-btn";
    matchDiacriticsBtn.id = "match-diacritics-btn";
    matchDiacriticsBtn.innerHTML = `<svg width="25" height="25" viewBox="-0.65 -0.62 20 20" fill="none"><path fill="#C1C1D2" d="M3.69602 14H2.2983L5.43892 5.27273H6.96023L10.1009 14H8.70312L6.2358 6.85795H6.16761L3.69602 14ZM3.9304 10.5824H8.46449V11.6903H3.9304V10.5824ZM13.1637 14.1449C12.7489 14.1449 12.3739 14.0682 12.0387 13.9148C11.7035 13.7585 11.4379 13.5327 11.2418 13.2372C11.0487 12.9418 10.9521 12.5795 10.9521 12.1506C10.9521 11.7812 11.0231 11.4773 11.1651 11.2386C11.3072 11 11.4989 10.8111 11.7404 10.6719C11.9819 10.5327 12.2518 10.4276 12.5501 10.3565C12.8484 10.2855 13.1523 10.2315 13.462 10.1946C13.854 10.1491 14.1722 10.1122 14.4165 10.0838C14.6609 10.0526 14.8384 10.0028 14.9492 9.93466C15.06 9.86648 15.1154 9.75568 15.1154 9.60227V9.57244C15.1154 9.20028 15.0103 8.91193 14.8001 8.70739C14.5927 8.50284 14.283 8.40057 13.8711 8.40057C13.4421 8.40057 13.104 8.49574 12.8569 8.68608C12.6126 8.87358 12.4435 9.08239 12.3498 9.3125L11.1523 9.03977C11.2944 8.64205 11.5018 8.32102 11.7745 8.0767C12.0501 7.82955 12.3668 7.65057 12.7248 7.53977C13.0827 7.42614 13.4592 7.36932 13.854 7.36932C14.1154 7.36932 14.3924 7.40057 14.685 7.46307C14.9805 7.52273 15.256 7.63352 15.5117 7.79545C15.7702 7.95739 15.9819 8.18892 16.1467 8.49006C16.3114 8.78835 16.3938 9.17614 16.3938 9.65341V14H15.1495V13.1051H15.0984C15.016 13.2699 14.8924 13.4318 14.7276 13.5909C14.5629 13.75 14.3512 13.8821 14.0927 13.9872C13.8342 14.0923 13.5245 14.1449 13.1637 14.1449ZM13.4407 13.1222C13.793 13.1222 14.0941 13.0526 14.3441 12.9134C14.5969 12.7741 14.7887 12.5923 14.9194 12.3679C15.0529 12.1406 15.1197 11.8977 15.1197 11.6392V10.7955C15.0742 10.8409 14.9862 10.8835 14.8555 10.9233C14.7276 10.9602 14.5813 10.9929 14.4165 11.0213C14.2518 11.0469 14.0913 11.071 13.935 11.0938C13.7788 11.1136 13.6481 11.1307 13.543 11.1449C13.2958 11.1761 13.07 11.2287 12.8654 11.3026C12.6637 11.3764 12.5018 11.483 12.3796 11.6222C12.2603 11.7585 12.2006 11.9403 12.2006 12.1676C12.2006 12.483 12.3171 12.7216 12.5501 12.8835C12.783 13.0426 13.0799 13.1222 13.4407 13.1222ZM13.3938 6.58097L14.391 4.61648H15.7333L14.4123 6.58097H13.3938Z" /></svg>`;



    const voiceRecBtn = document.createElement("div");
    voiceRecBtn.title = "Voice Search";
    voiceRecBtn.className = "input-btn";
    voiceRecBtn.id = "voice-rec-btn";
    voiceRecBtn.innerHTML = `<svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 14.2857C13.4229 14.2857 14.5714 13.1371 14.5714 11.7143V6.57143C14.5714 5.14857 13.4229 4 12 4C10.5771 4 9.42857 5.14857 9.42857 6.57143V11.7143C9.42857 13.1371 10.5771 14.2857 12 14.2857Z" fill="#c1c1d2"></path> <path d="M16.5429 11.7143H18C18 14.6371 15.6686 17.0543 12.8571 17.4743V20.2857H11.1429V17.4743C8.33143 17.0543 6 14.6371 6 11.7143H7.45714C7.45714 14.2857 9.63429 16.0857 12 16.0857C14.3657 16.0857 16.5429 14.2857 16.5429 11.7143Z" fill="#c1c1d2"></path> </g></svg>`

    voiceRecBtn.style.display = 'none';

    let currentRecognition = null;
    voiceRecBtn.addEventListener("click", async (e) => {

        let isBrave = false;
        let isWebkitAvailable = true;

        if (!('webkitSpeechRecognition' in window)) {
            isWebkitAvailable = false;
        }

        if (navigator.brave && await navigator.brave.isBrave()) {
            isBrave = true;
        }

        if (isWebkitAvailable) {
            if (currentRecognition !== null) {
                currentRecognition.abort();
                return;
            }
            voiceRecBtn.classList.add("active");
            const recognition = new webkitSpeechRecognition();
            currentRecognition = recognition;
            recognition.lang = Constants.PREF.langDialect;
            recognition.interimResults = false;
            recognition.continuous = false;


            recognition.onaudiostart = () => {
                // console.log("Voice recognition started.");
            };

            recognition.onspeechend = () => {
                // console.log("Speech ended, processing...");
            };

            recognition.onresult = (event) => {
                const result = event.results[0][0].transcript;
                input.value = result;
                search(input.value);
            };

            recognition.onerror = (event) => {
                console.log("ui > recognition error >",event.error);

                let errorMsg;

                if (isBrave && (event.error === "network" || event.error === "not-allowed")) {
                    errorMsg = "Sorry, Brave doesn't support the underlying voice features.";
                }
                else if (event.error === "not-allowed") {
                    errorMsg = "Voice recognition was not allowed on this page.";
                }
                else if (event.error === "aborted") {
                    return;
                }
                else if (event.error === "network") {
                    errorMsg = "Voice recognition failed: Network error.";
                }
                else if (event.error === "no-speech") {
                    errorMsg = "Voice recognition failed: No speech detected.";
                }
                else {
                    errorMsg = "Voice recognition failed: " + event.error;
                }

                new CornerMessage(shadowRoot, errorMsg).show();
            };

            recognition.onnomatch = () => {
                new CornerMessage(shadowRoot, "Sorry, Your voice wasn't captured properly.").show();
            };

            // ? onend always fires no matter what that's why we have classlist.remove and currentRecognition here
            recognition.onend = () => {
                voiceRecBtn.classList.remove("active");
                currentRecognition = null;
                // console.log("Recognition ended.");
            };
            recognition.start();
        }
        else {
            new CornerMessage(shadowRoot, "Sorry, Your browser doesn't support the underlying voice features.");
        }
    });

    let debouncer = null;

    input.addEventListener("input", (e) => {

        const query = e.target.value;

        if (uiStates.normal) {
            if (debouncer) {
                clearTimeout(debouncer);
                debouncer = null;
            }
            debouncer = setTimeout(() => {
                search(query);
            }, 50);
        }

        // ? When you are not in normal search mode then changing input should clear current highlights
        regexAutoSetted = false;

    });


    inputContainer.append(input, matchDiacriticsBtn, matchCaseBtn, matchWholeBtn, voiceRecBtn);

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

    // ? svg namespace
    const SVG_NS = "http://www.w3.org/2000/svg";

    function createArrowSvg(id, title, pathData) {
        const svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("id", id);
        svg.setAttribute("title", title);
        svg.setAttribute("class", "arrow");
        svg.setAttribute("width", "25");
        svg.setAttribute("height", "15");
        svg.setAttribute("viewBox", "0 0 25 20");
        svg.setAttribute("fill", "none");

        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("fill-rule", "evenodd");
        path.setAttribute("clip-rule", "evenodd");
        path.setAttribute("d", pathData);
        path.setAttribute("fill", "#c1c1d2");

        svg.appendChild(path);
        return svg;
    }
    const upPath = "M12 7C12.2652 7 12.5196 7.10536 12.7071 7.29289L19.7071 14.2929C20.0976 14.6834 20.0976 15.3166 19.7071 15.7071C19.3166 16.0976 18.6834 16.0976 18.2929 15.7071L12 9.41421L5.70711 15.7071C5.31658 16.0976 4.68342 16.0976 4.29289 15.7071C3.90237 15.3166 3.90237 14.6834 4.29289 14.2929L11.2929 7.29289C11.4804 7.10536 11.7348 7 12 7Z";
    const downPath = "M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z";

    const upArrow = createArrowSvg("up-arrow", "Previous", upPath);
    const downArrow = createArrowSvg("down-arrow", "Next", downPath);


    upArrow.addEventListener('click', () => {
        Iterator.previous();
    });

    downArrow.addEventListener('click', () => {
        Iterator.next();
    });

    moveArrows.appendChild(upArrow);
    moveArrows.appendChild(downArrow);
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

    function onSearchStateChange(newState) {
        switch (newState) {
            case Constants.SEARCH_STATES.idle:
                searchSvgDiv.style.display = "flex";
                loadingImg.style.display = "none";
                moveArrows.style.display = "none";
                break;
            case Constants.SEARCH_STATES.searching:
                searchSvgDiv.style.display = "none";
                loadingImg.style.display = "flex";
                moveArrows.style.display = "none";
                break;
            case Constants.SEARCH_STATES.complete:
                searchSvgDiv.style.display = "none";
                loadingImg.style.display = "none";
                moveArrows.style.display = "flex";
                break;

            default:
                break;
        }
    }

    updateSearchState = (newState) => { onSearchStateChange(newState); };

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


    // ? Setting last mode
    const lastMode = await getPreference("lastMode");
    uiStates[lastMode] = true;

    if (lastMode === "regex" && !showRegexSearch) uiStates["normal"] = true;
    else if (lastMode === "fuzzy" && !showFuzzySearch) uiStates["normal"] = true;
    else if (lastMode === "phonetic" && !showPhoneticSearch) uiStates["normal"] = true;

    const lastNav = await getPreference("lastNav");
    uiStates.searchArea.nav = lastNav;

    const lastMain = await getPreference("lastMain");
    uiStates.searchArea.main = lastMain;

    const lastCode = await getPreference("lastCode");
    uiStates.searchArea.code = lastCode;



    // Helper function for checkboxes
    function createCheckbox(parent, wrapperClass, labelClass, labelText, inputName, toolTip, isChecked, onChange) {
        const wrapper = document.createElement("div");
        wrapper.className = wrapperClass;
        wrapper.title = toolTip;

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
    createCheckbox(areaTags, "tag", "tag-name", "Main", "", "Searches the main body content.", uiStates.searchArea.main, (e) => uiStates.searchArea.main = e.target.checked);
    createCheckbox(areaTags, "tag", "tag-name", "Nav", "", "Searches in menus and navigations.", uiStates.searchArea.nav, (e) => uiStates.searchArea.nav = e.target.checked);


    if (isDev) {
        createCheckbox(areaTags, "tag", "tag-name", "Code", "", "Searches in the Code blocks.", uiStates.searchArea.code, (e) => uiStates.searchArea.code = e.target.checked);
    }

    // Add Modes
    const modeConfigs = [
        { name: "normal", label: "Exact", toolTip: "Finds the exact word or phrase." }
    ];

    const showRegexSearch = await getPreference("showRegexSearch");
    const showFuzzySearch = await getPreference("showFuzzySearch");
    const showPhoneticSearch = await getPreference("showPhoneticSearch");

    if (showRegexSearch) {
        modeConfigs.push({ name: "regex", label: "Pattern", toolTip: "RegEx Matching" });
    }
    if (showFuzzySearch) {
        modeConfigs.push({ name: "fuzzy", label: "Partial", toolTip: "Typo-tolerant Matching" });
    }
    if (showPhoneticSearch) {
        modeConfigs.push({ name: "phonetic", label: "Sounds-like", toolTip: "Matches similar sounding words." });
    }

    if (lastMode === "regex" && !showRegexSearch) {

    }

    const modeCheckboxes = modeConfigs.map(config => {
        return createCheckbox(modes, "mode", "mode-name", config.label, config.name, config.toolTip, uiStates[config.name]);
    });

    modesContainer.append(areaTags, modes);
    container.append(searchPanel, modesContainer, iteratorPane);
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

    matchDiacriticsBtn.addEventListener("click", (e) => {
        uiStates.matchDiacritics = !uiStates.matchDiacritics;
        e.currentTarget.classList.toggle("active", uiStates.matchDiacritics);
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


    // ? IDK why but there seems to be some depandancy error that causes references to go undefine when these try to change value and PROXY runs set
    if (lastMatchCase) {
        matchCaseBtn.classList.toggle("active", true);
        uiStates.matchCase = true;
    }

    if (lastMatchWhole) {
        matchWholeBtn.classList.toggle("active", true);
        uiStates.matchWhole = true;
    }

    if (lastMatchDiacritics) {
        matchDiacriticsBtn.classList.toggle("active", true);
        uiStates.matchDiacritics = true;
    }


    // ? Only goes for input buttons and search button states
    function refreshUi() {

        if (uiStates.normal) {
            matchDiacriticsBtn.style.display = "flex";
            matchCaseBtn.style.display = "flex";
            matchWholeBtn.style.display = "flex";
        }
        else {
            matchDiacriticsBtn.style.display = "none";
            matchCaseBtn.style.display = "none";
            matchWholeBtn.style.display = "none";
        }

        if (!showMatchDiacritics) {
            matchDiacriticsBtn.style.display = "none";
        }

        if (uiStates.phonetic) {
            voiceRecBtn.style.display = "flex";
        }
        else {
            voiceRecBtn.style.display = "none";
        }


    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.target === "tab") {
            switch (message.action) {
                case "show-error":
                    new CornerMessage(shadowRoot, message.error).show();
                    break;

                default:
                    console.log("ui.js > chrome.runtime.onMessage > message.target > default case: " + message.action);
                    break;
            }
        }
    });


    refreshUi();

    return { input, container, shadowRoot, host, iteratorPane };
}



