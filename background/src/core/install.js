import * as Constants from "../_lib/constants.js";

chrome.runtime.onInstalled.addListener(async details => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        await chrome.storage.local.set(Constants.DEFAULT_SETTINGS);

        chrome.alarms.create("ask-for-ratings-alarm", {
            delayInMinutes: 60
        });

        // TODO: chrome.tabs.create({ url: 'chrome://newtab' });
        // TODO: chrome.runtime.setUninstallURL('https://www.ainoyash.com/projects/pokemon-retro-themes/help-and-feedback');
        
    }
    else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {

        const settingsKeys = Object.keys(Constants.DEFAULT_SETTINGS);
           
        chrome.storage.local.get(settingsKeys, (existingSettings) => {
            const newSettings = {
                ...Constants.DEFAULT_SETTINGS, ...existingSettings
            }
            chrome.storage.local.set(newSettings);
        });
    }
});