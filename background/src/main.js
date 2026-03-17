'use strict';
import "./core/install.js";
import "./core/rating.js";
import "./core/contextMenu.js";

import { getPreference } from "./_lib/utils.js";




// ! need to add logic where you check tab type and url and based on that take action
chrome.commands.onCommand.addListener(async (command, tab) => {
    const extensionOn = await getPreference("extensionOn");

    if (command === "search-current-page" && extensionOn) {
        chrome.tabs.sendMessage(tab.id, { target: "tab", action: "search-current-page" });
    }

    // ! Add action listen cmd as well for fallback
});





chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target === 'background') {
        switch (message.action) {
            case "show-error-delegation":

                if (message.delegateTo === "tab") {
                    chrome.tabs.sendMessage(message.oriSenderId, { target: "tab", action: "show-error", error: message.error });
                }

                break;


            default:
                break;
        }
    }
});


chrome.action.onClicked.addListener(async (tab) => {
    const extensionOn = await getPreference("extensionOn");
    if (extensionOn) {
        chrome.tabs.sendMessage(tab.id, { target: "tab", action: "search-current-page" });
    }
});


