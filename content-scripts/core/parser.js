"use strict";

/// <reference path="../initializer.js" />


SearchExt.Parser = (function (Constants) {

    function getTextNodes(root = document.body, options) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: nodeFilter
            }
        );
        

        const nodes = [];
        let node;

        while ((node = walker.nextNode())) {
            nodes.push(node);
        }

        return nodes;
    }

    function nodeFilter(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;

        const parentEl = node.parentElement;

        if (parentEl && Constants.IGNORED_TAGS.has(parentEl.tagName)) {
            return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
    }

    function isNodeVisible(textNode) {
        const parentEl = textNode.parentElement;
        if (!parentEl) return false;

        // * checkVisibility is pretty new (since 2023 only) 
        if (parentEl.checkVisibility) {
            const isVisible = parentEl.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
            if (!isVisible) return false;
        }

        const rect = parentEl.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
        // ! Can consider adding getComputedStyle based on performance
    }

    return {
        getTextNodes,
        isNodeVisible
    };

})(SearchExt.Constants);
