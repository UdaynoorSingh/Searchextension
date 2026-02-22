"use strict";
/// <reference path="../initializer.js" />

SearchExt.Highlighter = (function () {

    /**
    * @param {Node} textNode
    * @param {Number} startIndex
    * @param {Number} matchLength
    */
    function highlightTextNode(textNode, startIndex, matchLength) {

        // ? textNode.splitText is going to split node present in DOM into 2 parts
        // ? text before the spliting point is original textNode and text after will be made into a new text node and returned
        try {
            const matchNode = textNode.splitText(startIndex);
            matchNode.splitText(matchLength);

            const highlightEl = document.createElement('mark');
            highlightEl.className = 'search-ext-highlight';
            highlightEl.style.all = 'unset';
            highlightEl.style.backgroundColor = 'lightblue';
            highlightEl.style.color = 'black';

            highlightEl.textContent = matchNode.textContent;
            matchNode.parentNode.replaceChild(highlightEl, matchNode);

            // return highlightEl;

        } catch (error) {
            console.error(error);
        }
    }

    /**
    * @param {Node} root 
    */
    function clearHighlights(root = document.body) {

        const marks = root.querySelectorAll('mark.search-ext-highlight');

        marks.forEach(mark => {
            const textNode = document.createTextNode(mark.textContent);
            mark.parentNode.replaceChild(textNode, mark);
        });

        // ? native DOM method to combine text fragments back together
        root.normalize();
    }

    return {
        highlightTextNode,
        clearHighlights
    };
})();