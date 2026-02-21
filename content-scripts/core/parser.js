"use strict";

const SearchExt = window.SearchExt || {};

SearchExt.Parser = (function(Constants) {
    
    function getVisibleTextNodes(root = document.body) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                    
                    const parent = node.parentElement;
                    // Accessing the exposed constant
                    if (parent && Constants.IGNORED_TAGS.has(parent.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodes = [];
        let node;
        while ((node = walker.nextNode())) {
            nodes.push({ node, oriText: node.textContent });
        }
        return nodes;
    }

    function isNodeVisible(textNode) {
        const el = textNode.parentElement;
        if (!el) return false;

        if (el.checkVisibility) {
            return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
        }

        if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') {
            return false;
        }

        const style = getComputedStyle(el);
        return style.visibility !== "hidden" && parseFloat(style.opacity) > 0;
    }

    // Expose the functions so content.js can use them
    return {
        getVisibleTextNodes,
        isNodeVisible
    };
})(SearchExt.Constants);
