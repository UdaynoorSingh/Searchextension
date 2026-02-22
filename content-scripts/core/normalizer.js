"use strict";

/// <reference path="../initializer.js" />


SearchExt.Normalizer = (function () {
    /**
    * @param {string} text -
    * @param {{ removeDiacritics: boolean, caseInsentive: boolean }} options 
    * @returns {string} 
    */
    function normalize(text, options) {
        let normalizedText = text;

        if (options.removeDiacritics) {

        }

        if (options.caseInsentive) {
            normalizedText = normalizedText.toLowerCase();
        }

        return normalizedText
    }

    return {
        normalize
    };
})();
