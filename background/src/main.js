'use strict';
import "./core/install.js";
import "./core/rating.js";
import "./core/contextMenu.js";
import { getPreference, isBoardingPage, validateTabAndNotify } from "./_lib/utils.js";



// ! need to add logic where you check tab type and url and based on that take action
chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "search-current-page") {
        onSearchCurrentPageCmd(tab);
    }
});


chrome.action.onClicked.addListener((tab) => {
    onSearchCurrentPageCmd(tab);
});


async function onSearchCurrentPageCmd(tab) {


    const hasBoarded = await getPreference("hasBoarded");

    if (await isBoardingPage(tab)) {
        chrome.tabs.sendMessage(tab.id, { target: "tab", action: "search-current-page" });
        return;
    }

    if (!hasBoarded) {
        chrome.tabs.create({ url: chrome.runtime.getURL("page-boarding/dist/index.html") });
        return;
    }



    const extensionOn = await getPreference("extensionOn");

    if (extensionOn) {

        const validPage = await validateTabAndNotify(tab);

        if (validPage) {
            chrome.tabs.sendMessage(tab.id, { target: "tab", action: "search-current-page" });
        }
    }
}





chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target === 'background') {
        switch (message.action) {
            case "show-error-delegation": {
                if (message.delegateTo === "tab") {
                    chrome.tabs.sendMessage(message.oriSenderId, { target: "tab", action: "show-error", error: message.error });
                }
                break;
            }
            default:
                break;
        }
    }
});


