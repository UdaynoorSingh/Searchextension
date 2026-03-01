"use strict";
import * as Constants from "./constants.js"

/**
* @param {string} text 
* @param {string} query 
* @param {{matchType: string, matchWhole: boolean}} options 
* @returns {{startIndex: number, matchLength: number}[]}     
*/
export function match(text, query, options) {

    console.log(options.matchType);
    
    switch (options.matchType) {
        case "Exact":
            return exactMatch(text, query, options.matchWhole);
            break;

        case "RegEx":
            return regexMatch(text, query);
            break;
        case "Fuzzy":
            break;
        case "Semantic":
            break;
        case "Phonetic":
            break;

        default:
            console.error("Matcher.match: Fell in default case", options);
            break;
    }
}

/**
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

    let pattern;
    if (Constants.PREF.isDev) {
        // ? A developer expects yash to not match in _yash_
        pattern = matchWhole ? `(?<![a-zA-Z0-9_])${escapedQuery}(?![a-zA-Z0-9_])` : escapedQuery; // * Functionally same as using \b
    } else {
        pattern = matchWhole ? `(?<![a-zA-Z0-9])${escapedQuery}(?![a-zA-Z0-9])` : escapedQuery;
    }

    const regex = new RegExp(pattern, 'g');

    // ? string.matchAll() returns an iterator
    for (const result of text.matchAll(regex)) {
        matches.push({ startIndex: result.index, matchLength: query.length });
    }

    return matches;
}

/**
* @param {string} text 
* @param {string} query 
* @param {boolean} matchWhole 
* @returns {{startIndex: number, matchLength: number}[]}     
*/
function regexMatch(text, query) {
    try {
        const matches = [];

        // ? here () makes a group showing what to return
        // * A regex matches the  /pattern/flags
        const parsedQuery = query.match(/^\/(.+)\/([dgimsuyv]*)$/);
        
        const pattern = parsedQuery[1];
        const flags = parsedQuery[2];

        const regex = new RegExp(pattern, flags);

        // ? string.matchAll() returns an iterator
        for (const result of text.matchAll(regex)) {
            matches.push({ startIndex: result.index, matchLength: result[0].length });
        }

        return matches;
    } catch (error) {
        console.error(error);
    }
}

function fuzzyMatch(text, query) {
    const matches = [];


    return matches;
}

