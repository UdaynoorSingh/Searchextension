// * Realize: any global variables declared here will not polulate the runtime environment as content.js runs in its own context 
// ? This is a comment that tells vs code that these both share same environment
/// <reference path="./core/constants.js" />

let searchContainer = null;
let searchInput = null;

let controller = null;

console.log(IGNORED_TAGS);

async function search(query) {
    if (controller) controller.abort();

    controller = new AbortController();
    const signal = controller.signal;

    try {

        if (signal.aborted) return;

        console.log("tried searching " + query);
    } catch (error) {
        console.error(error);
    }
}


function setupContainer() {
    const body = document.querySelector("body");

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.for === "search-current-page") {
        if (searchContainer === null || searchContainer === undefined) {
            setupContainer();
        }
        else if (searchContainer.style.display === "none") {
            searchContainer.style.display = "flex";
            searchInput.focus();
            searchInput.select();
        }
        else {
            searchInput.focus();
            searchInput.select();
        }
    }
});


document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (searchContainer !== null && searchContainer !== undefined) {
            if (searchContainer.style.display !== "none") {
                e.preventDefault();
                searchContainer.style.display = "none";
            }
        }
    }
});



function getVisibleTextNodes(root = document.body) {
    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                // ? Skip empty/whitespace text
                if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;

                
                
                // ! not checking if node is visible
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const nodes = [];
    let node;

    while ((node = walker.nextNode())) {
        nodes.push({node, oriText: node.textContent});
    }
    
    return nodes;
}














// ! Choose one of the isNodeVisible later
// ? isNodeVisible is very expensive so we will run it only when a search match happens if needed
function isNodeVisible1(textNode) {
    const el = textNode.parentElement;

    if (!el) return false;

    const style = getComputedStyle(el);

    if (   // rememeber these are not the only text nodes that we don't want
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.visibility === "collapse" ||
        parseFloat(style.opacity) === 0
    ) {
        return false;
    }

    // Extra check: element must have non-zero size
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    return true;
}

function isNodeVisible2(textNode) {
    const el = textNode.parentElement;
    if (!el) return false;

    // Modern, highly optimized native API for checking visibility
    // Handles opacity: 0, display: none, visibility: hidden, etc.
    if (el.checkVisibility) {
        return el.checkVisibility({
            checkOpacity: true,
            checkVisibilityCSS: true
        });
    }

    // Fallback for older browsers
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') {
        return false; 
    }
    
    const style = getComputedStyle(el);
    return style.visibility !== "hidden" && parseFloat(style.opacity) > 0;
}
