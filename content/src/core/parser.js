"use strict";
import * as Constants from "../_lib/constants.js";



// ! The parser will break all the points where there is a match inside of the contentEditable fix it/**
/** 
 * @param { Node } root
 * @param { Node[] } shadowRoots
 * @param { Node[] } nodes
 * @param { { includeMain: boolean, includeNav: boolean, includeCode: boolean } } options
 */
export function getTextNodes(root = document.body, shadowRoots, nodes, options) {


    function nodeFilter(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {

            if (Constants.IGNORED_TAGS.has(node.tagName)) {
                return NodeFilter.FILTER_REJECT;
            }

            // ? This check is most likely not needed but gemini suggested it
            // ? I mean that all the other architecture is built with the fact that mark from hightlighter never enters this so...
            if (node.tagName === Constants.HIGHLIGHTED_EL_TAGNAME && node.classList.contains(Constants.HIGHLIGHTED_EL_CLASSNAME)) {
                return NodeFilter.FILTER_REJECT;
            }

            if (node.shadowRoot) {
                if (shadowRoots.indexOf(node.shadowRoot) === -1) {
                    shadowRoots.push(node.shadowRoot);
                }
                getTextNodes(node.shadowRoot, shadowRoots, nodes, options);
            }


            if (!options.includeNav && Constants.NAV_TAGS.has(node.tagName) && node.tagName !== "A") {
                return NodeFilter.FILTER_REJECT;
            }

            // ? Third option is so that when code element is inside of Navigations it doesn't reject that element
            if (!options.includeCode && Constants.CODE_TAGS.has(node.tagName) && !node.closest(Constants.NAV_SELECTOR)) {
                return NodeFilter.FILTER_REJECT;
            }

            // ? Always skip otherwise
            return NodeFilter.FILTER_SKIP;

        } else {

            if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;

            // If includeMain is false, we must verify this text belongs to a Nav or Code block
            if (!options.includeMain) {
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;

                const inNav = options.includeNav && parent.closest(Constants.NAV_SELECTOR);
                const inCode = options.includeCode && parent.closest(Constants.CODE_SELECTOR);

                if (!inNav && !inCode) {
                    return NodeFilter.FILTER_REJECT;
                }
            }

            return NodeFilter.FILTER_ACCEPT;
        }
    }

    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        { acceptNode: nodeFilter }
    );

    let node;
    while ((node = walker.nextNode())) {
        nodes.push(node);
    }

}


export function isNodeVisible(textNode) {
    const parentEl = textNode.parentElement;
    if (!parentEl) return false;



    if (parentEl.checkVisibility) {
        return parentEl.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    }

    const rect = parentEl.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}
// ! Can consider adding getComputedStyle based on performance
// ? If user complain that even though nothing is there it is still showing things then we can add this