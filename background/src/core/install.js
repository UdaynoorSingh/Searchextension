import * as Constants from "../_lib/constants.js";

chrome.runtime.onInstalled.addListener(async details => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        await chrome.storage.local.set(Constants.DEFAULT_SETTINGS);

        chrome.alarms.create("ask-for-ratings-alarm", {
            delayInMinutes: 60
        });

        chrome.tabs.create({ url: chrome.runtime.getURL("page-boarding/dist/index.html") });
        chrome.runtime.setUninstallURL('https://docs.google.com/forms/d/e/1FAIpQLSc1gqbiMHNq3ZUuJCpTXG5BSB8tu6lRwNM5NsB5LwjfsDT0Kg/viewform');
        
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