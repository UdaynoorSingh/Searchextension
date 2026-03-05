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