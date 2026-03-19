import { getPreference } from "../_lib/utils.js";
import * as Constants from "../_lib/constants.js"

let index = null;
// ? prevIndex exists solely for removing prev highlights
let prevIndex = null;

let nodes = [];

let iteratorPane = null;
let iteratorPaneInput = null;
let iteratorPaneResult = null;

let scrollSnap = false;
let theme = "standard";


(async () => {
    scrollSnap = await getPreference("scrollSnap");
    theme = await getPreference("theme");
})();


export function clearNodes() {
    index = null;
    prevIndex = null;
    nodes = [];

    if (iteratorPane) {
        iteratorPane.style.top = "0%";
    }
}

export function init(newIteratorPane) {
    iteratorPane = newIteratorPane;
    iteratorPaneInput = iteratorPane.querySelector("input");
    iteratorPaneResult = iteratorPane.querySelector("span");

    iteratorPane.style.top = "-47%";

    iteratorPaneInput.addEventListener('input', (e) => {

        let value = e.target.value.replace(/\D/g, '');
        let numValue = parseInt(value, 10);

        if (numValue > nodes.length) {
            e.target.value = nodes.length;
        }
        else if (numValue < 0) {
            e.target.value = 1;
        }
        else {
            e.target.value = isNaN(numValue) ? '0' : numValue;
        }


        if (e.target.value === 0) {
            index = null;
        }
        else index = parseInt(e.target.value) - 1;

        onIndexChange();
    });

    iteratorPaneInput.addEventListener("focus", (e) => {
        e.target.select();
    });

    updateIteratorPane();
}

export function appendNode(node) {
    nodes.push(node);

    updateIteratorPane();
}

export function next() {
    if (nodes.length === 0) return;
    prevIndex = index;

    if (index === null) index = 0;
    else index = (index + 1) % nodes.length;

    onIndexChange();
}

export function previous() {
    if (nodes.length === 0) return;
    prevIndex = index;

    if (index === null) index = nodes.length - 1;
    else {
        if (index === 0) index = nodes.length - 1;
        else index--;
    }

    onIndexChange();
}


// ? fromNext determines whether the call is coming from next function or not for removing prev hightlight
function onIndexChange() {

    if (prevIndex !== null && nodes[prevIndex]) {
        nodes[prevIndex].style.backgroundColor = Constants.themes[theme]["highlightBg"];
        nodes[prevIndex].style.color = Constants.themes[theme]["highlightColor"];
    }

    const currentNode = nodes[index];
    if (currentNode) {
        currentNode.style.backgroundColor = Constants.themes[theme]["currentBg"];
        currentNode.style.color = Constants.themes[theme]["currentColor"];

        if (scrollSnap) {
            currentNode.scrollIntoView({
                behavior: 'instant',
                block: 'center',
                inline: 'nearest'
            });
        }
        else {
            currentNode.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }

    }

    prevIndex = index; // ? This removes the edge case where users multiple times manually changed the value and that particular index will be unhighlighted

    updateIteratorPane();
}


function updateIteratorPane() {
    if (nodes.length === 0) {
        iteratorPaneInput.value = 0;
        iteratorPaneResult.textContent = 0;

        return;
    }

    iteratorPaneInput.value = (index === null) ? 0 : index + 1;
    iteratorPaneResult.textContent = nodes.length;
}