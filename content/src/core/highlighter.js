"use strict";
import * as Constants from "../_lib/constants.js";
import { getPreference } from "../_lib/utils.js";

let theme = "standard";

(async () => {
    theme = await getPreference("theme");
})();


// ? for highlighter to work on matches array the array should be in descending order
/**
* @param {Node} textNode
* @param {Number} startIndex
* @param {Number} matchLength
*/
export function highlightTextNode(textNode, startIndex, matchLength) {

    // ? textNode.splitText is going to split node present in DOM into 2 parts
    // ? text before the spliting point is original textNode and text after will be made into a new text node and returned
    try {
        const matchNode = textNode.splitText(startIndex);
        matchNode.splitText(matchLength);

        const highlightEl = document.createElement('mark');
        highlightEl.className = Constants.HIGHLIGHTED_EL_CLASSNAME;
        highlightEl.style.all = 'unset';
        highlightEl.style.backgroundColor = Constants.themes[theme]["highlightBg"];
        highlightEl.style.color = Constants.themes[theme]["highlightColor"];

        highlightEl.textContent = matchNode.textContent;
        matchNode.parentNode.replaceChild(highlightEl, matchNode);

        return highlightEl;

        // ? If the error handling was happening over all text nodes at once then the textNodes after error would also be ignoured holy moly i got lucky with this one
    } catch (error) {
        // ! There will be tons of hightlight errors coming because of split text when the text is coming from dynamic search but the good part is that we need not to solve it
        // ? It is actually better to not add logic for handling these error as these error do not make result difference
        // ? The original source of errors is MutationObserver's batching 
        // ? if i am making 'y' in "yay" then 4 mutations will be created where 2 of the text nodes will be same
        // console.error("highlighter > highlightTextNode", error);
    }
}

/**
* @param {Node} root 
*/
export function clearHighlights(root = document.body) {

    const marks = root.querySelectorAll('mark.search-ext-highlight');

    marks.forEach(mark => {
        const textNode = document.createTextNode(mark.textContent);
        mark.parentNode.replaceChild(textNode, mark);
    });

    // ? native DOM method to combine text fragments back together
    root.normalize();
}