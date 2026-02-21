'use strict';

const defaultSettings = {

};

chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.storage.local.set(defaultSettings);
    }
    else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        chrome.storage.local.get(null, (existingSettings) => {
            const newSettings = {
                ...defaultSettings, ...existingSettings
            }
            chrome.storage.local.set(newSettings);
        });
    }
});




// ! need to add logic where you check tab type and url and based on that take action
chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "search-current-page") {
        chrome.tabs.sendMessage(tab.id, {
            for: "search-current-page"
        });
    }
});

