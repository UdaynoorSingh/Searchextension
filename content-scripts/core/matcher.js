"use strict";
/// <reference path="../initializer.js" />

SearchExt.Matcher = (function () {

    /**
    * 
    * @param {string} text 
    * @param {string} query 
    * @param {{matchType: string, matchWhole: boolean}} options 
    * @returns {{startIndex: number, matchLength: number}[]}     
    */
    function match(text, query, options) {

        switch (options.matchType) {
            case "Exact":
                return exactMatch(text, query, options.matchWhole);
                break;

            default:
                console.error("Matcher.match: Fell in default case", options);
                break;
        }
    }

    /**
    * 
    * @param {string} text 
    * @param {string} query 
    * @param {boolean} matchWhole 
    * @returns {{startIndex: number, matchLength: number}[]}     
    */

    function exactMatch(text, query, matchWhole) {
        const matches = [];

        // ? $& is a special replacement variable it will put whatever that was found before
        // ? we are having \\ because js treats \\ as one \
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // ! Exact match is not perfect \b will match of _ as well and there should have been custom logic that accounts for all other symbols too
        // ! Searching state inside a_state_b will not match anything  
        const pattern = matchWhole ? `\\b${escapedQuery}\\b` : escapedQuery;

        // string.matchAll() returns an iterator
        for (const result of text.matchAll(pattern)) {
            matches.push({ startIndex: result.index, matchLength: query.length });
        }

        return matches;
    }

    return {
        match
    };
})();