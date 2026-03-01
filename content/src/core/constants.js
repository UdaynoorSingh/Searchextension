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

export const PREF = {
    isDev:false
};


