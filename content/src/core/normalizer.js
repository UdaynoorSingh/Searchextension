"use strict";



    /**
    * @param {string} text -
    * @param {{ matchDiacritics: boolean, caseInsensitive: boolean }} options 
    * @returns {string} 
    */
export    function normalize(text, options) {
        let normalizedText = text;

        console.log(options.matchDiacritics)
        // ! This is a very basic diacritices removal, There will be highlighting missmatches when a char é is combination of 2 unicode chars
        if (!options.matchDiacritics) {
            normalizedText = normalizedText.normalize('NFD').replace(/[\u0300-\u036f]/g, '') // ? The range \u0300-\u036f will remove stuff like '' ` ~ etc etc...
        }

        if (options.caseInsensitive) {
            normalizedText = normalizedText.toLowerCase();
        }

        return normalizedText
    }


