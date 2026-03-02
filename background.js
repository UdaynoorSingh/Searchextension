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
            target: "tab",
            action: "search-current-page"
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.target === 'background') {
        switch (message.action) {
            case 'take-audio-input':
        
                setupOffscreenDocument().then(() => {
                    chrome.runtime.sendMessage({ target: 'offscreen', action: 'take-audio-input', oriSenderId: sender.tab.id });
                });

                break;

            case "audio-input-result-delegation":
                chrome.tabs.sendMessage(message.oriSenderId, { target: "tab", action: "audio-input-result", result: message.result });

                break;
            default:
                break;
        }

    }
});


async function setupOffscreenDocument() {
    const offscreenUrl = chrome.runtime.getURL('offscreen/offscreen.html');
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
    });

    if (existingContexts.length > 0) return;

    await chrome.offscreen.createDocument({
        url: offscreenUrl,
        reasons: ['USER_MEDIA'],
        justification: 'Recording voice input for extension features'
    });
}

