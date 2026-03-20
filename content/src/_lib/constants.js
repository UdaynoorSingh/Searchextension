'use strict';
// ! SVGs & Canvas: Text inside <svg> uses <text> elements which behave differently than standard HTML text nodes
// ! and will break if wrapped in standard HTML highlight tags.


export const IGNORED_TAGS = new Set([
    // Scripts, Styles, & Templates (Non-visual structure)
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE',

    // Document Metadata
    'HEAD', 'TITLE', 'META', 'LINK', 'BASE',

    // Embedded Content & Media (Text inside is usually fallback/unrendered)
    'IFRAME', 'OBJECT', 'EMBED', 'APPLET', 'CANVAS', 'SVG', 'MATH',
    'AUDIO', 'VIDEO', 'PICTURE', 'MAP', 'AREA', 'TRACK',

    // Form Elements (Modifying text nodes here breaks inputs/dropdowns)
    'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'OPTGROUP', 'DATALIST',
    'METER', 'PROGRESS'
]);

export const NAV_TAGS = new Set(["NAV", "FOOTER", "A", "ASIDE", "HEADER", "MENU"]);
export const CODE_TAGS = new Set(["CODE", "PRE", "SAMP", "VAR"]);

export const NAV_SELECTOR = Array.from(NAV_TAGS).join(',');
export const CODE_SELECTOR = Array.from(CODE_TAGS).join(',');


export const PREF = {
    isDev: false,
    langDialect: "en-US"
};

export const DEFAULT_SETTINGS = {
    extensionOn: true,
    askForRatingsAlarmLimit: 7, // * In days
    isDev: false,
    langDialect: "en-US",
    showMatchDiacritics: false,
    scrollSnap: false,
    lastMode: "normal",

    lastNav: true,
    lastMain: true,
    lastCode: true,

    lastMatchCase: true,
    lastMatchWhole: true,
    lastMatchDiacritics: true,
};


export const HIGHLIGHTED_EL_CLASSNAME = "search-ext-highlight";
export const HIGHLIGHTED_EL_TAGNAME = "MARK";

export const themes = {
    standard: {
        highlightBg: '#ffff00',
        highlightColor: '#000000',
        currentBg: '#ff9632',
        currentColor: '#000000'
    },
    modern: {
        highlightBg: '#a8d1ff',
        highlightColor: '#000000',
        currentBg: '#005a9e',
        currentColor: '#ffffff'
    },
    highContrast: {
        highlightBg: '#b5e853',
        highlightColor: '#000000',
        currentBg: '#7a22cc',
        currentColor: '#ffffff'
    }
};

export const SEARCH_STATES = {
    idle: 1,
    searching: 2,
    complete: 3
};
