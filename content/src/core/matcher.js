"use strict";
import * as Constants from "../_lib/constants.js"
import { doubleMetaphone } from 'double-metaphone'
import Fuse from 'fuse.js';
import { ShowError } from "../ui/ui.js";

/**
* @param {string} text 
* @param {string} query 
* @param {{matchType: string, matchWhole: boolean}} options 
* @returns {{startIndex: number, matchLength: number}[]}     
*/
export function match(text, query, options) {

    switch (options.matchType) {
        case "Exact":
            {
                return exactMatch(text, query, options.matchWhole);
                break;
            }
        case "RegEx":
            {
                return regexMatch(text, query);
                break;
            }
        case "Fuzzy":
            {
                return fuzzyMatch(text, query);
                break;
            }
        case "Phonetic":
            {
                return phoneticMatch(text, query);
                break;
            }

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
        // ? 0 or more letters of any types  
        const parsedQuery = query.match(/^\/(.*)\/([dgimsuyv]*)$/);

        const pattern = parsedQuery[1];
        const flags = parsedQuery[2];


        if (pattern === "") {
            // ShowError("Please provide some pattern!");
            return;
        }

        if (!flags.includes("g")) {
            ShowError("Regular Expression must contain g flag!");
            return;
        }


        const regex = new RegExp(pattern, flags);

        // ? string.matchAll() returns an iterator
        for (const result of text.matchAll(regex)) {
            matches.push({ startIndex: result.index, matchLength: result[0].length });
        }

        return matches;
    } catch (error) {
        console.log("regex matching > ", error, query);
        ShowError("Error using this regular expression!");
    }
}

/**
* @param {string} text 
* @param {string} query 
* @returns {{startIndex: number, matchLength: number}[]}     
*/
function fuzzyMatch(text, query) {
    const matches = [];
    if (!query || query.length === 0) return matches;

    const tokens = [];
    const regex = new RegExp(/[a-zA-Z]+(?:['\-][a-zA-Z]+)*/, 'g');

    for (const match of text.matchAll(regex)) {
        tokens.push({
            word: match[0],
            startIndex: match.index
        });
    }

    const fuse = new Fuse(tokens, {
        keys: ['word'],
        threshold: 0.28,
        minMatchCharLength: Math.min(2, query.length)
    });

    const results = fuse.search(query);

    results.forEach(result => {
        matches.push({
            startIndex: result.item.startIndex,
            matchLength: result.item.word.length
        });
    });

    matches.sort((a, b) => a.startIndex - b.startIndex);

    return matches;
}



/**
* @param {string} text 
* @param {string} query 
* @returns {{startIndex: number, matchLength: number}[]}     
*/
function phoneticMatch(text, query) {
    const matches = [];
    const tokens = [];

    const regex = new RegExp(/[a-zA-Z]+(?:['\-][a-zA-Z]+)*/, 'g');

    for (const match of text.matchAll(regex)) {
        tokens.push({ text: match[0], startIndex: match.index });
    }


    const queryMetaphones = doubleMetaphone(query);

    tokens.forEach(token => {
        const metaphones = doubleMetaphone(token.text);

        if (metaphones.includes(queryMetaphones[0]) || metaphones.includes(queryMetaphones[1])) {
            matches.push({ startIndex: token.startIndex, matchLength: token.text.length });
        }
    });


    return matches;
}