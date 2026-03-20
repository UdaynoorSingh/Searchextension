import * as Constants from "./constants.js";

export async function getPreferences() {
    const keys = Object.keys(Constants.DEFAULT_SETTINGS);
    const stored = await chrome.storage.local.get(keys);

    if (Object.keys(stored).length === 0) {
        return Constants.DEFAULT_SETTINGS;
    }
    return stored;
}


export async function getPreference(key) {
    const stored = await chrome.storage.local.get([key]);
    let value = stored[key];

    if (value === undefined) {
        value = Constants.DEFAULT_SETTINGS[key]
        chrome.storage.local.set({ [key]: value });
    }

    return value;
}



export async function validateTabAndNotify(tab) {
    // tab.url might be undefined on some internal pages depending on permissions, fallback to pendingUrl
    const url = tab.url || tab.pendingUrl || "";
    const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();

    let errorTitle = "Cannot search on this page.";
    let errorMessage = "";

    if (url.startsWith("chrome://") || url.startsWith("edge://")) {
        errorMessage = "Browser settings and internal pages are restricted for security reasons.";
    } else if (url.startsWith("chrome-extension://")) {
        errorMessage = "Cannot search on other extension pages due to security reasons.";
    } else if (url.includes("chrome.google.com/webstore") || url.includes("chromewebstore.google.com")) {
        errorMessage = "Chrome blocks extensions from running on the Chrome Web Store.";
    } else if (cleanUrl.endsWith(".pdf")) {
        errorMessage = "Cannot search on pdf pages.";
    } else if (url.startsWith("file://")) {
        const isAllowed = await chrome.extension.isAllowedFileSchemeAccess();
        if (isAllowed) {
            errorMessage = "To search local files, enable 'Allow access to file URLs' in the extension management settings.";
        }
    } else if (url.startsWith("about:") || url.startsWith("view-source:")) {
        errorMessage = "This page format is not supported by the extension.";
    } else if (!url) {
        errorMessage = "Unable to search on this page.";
    }


    if (errorMessage) {
        chrome.notifications.create({
            type: "basic",
            iconUrl: chrome.runtime.getURL("assets/error.png"),
            title: errorTitle,
            message: errorMessage
        });
        return false;
    }

    return true;
}

export async function isBoardingPage(tab) {
    const url = tab.url;

    if (url === chrome.runtime.getURL("page-boarding/dist/index.html")) {
        return true;
    }
    else return false;
}