"use strict";



    /**
    * @param {string} text -
    * @param {{ removeDiacritics: boolean, caseInsensitive: boolean }} options 
    * @returns {string} 
    */
export    function normalize(text, options) {
        let normalizedText = text;

        
        // ! This is a very basic diacritices removal, There will be highlighting missmatches when a char é is combination of 2 unicode chars
        if (options.removeDiacritics) {
            normalizedText = normalizedText.normalize('NFD').replace(/[\u0300-\u036f]/g, '') // ? The range \u0300-\u036f will remove stuff like '' ` ~ etc etc...
        }

        if (options.caseInsensitive) {
            normalizedText = normalizedText.toLowerCase();
        }

        return normalizedText
    }


