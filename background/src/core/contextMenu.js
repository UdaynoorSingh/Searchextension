import { getPreference } from "../_lib/utils";

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "extension-on-off-ctx-menu",
        title: "Turn Off",
        contexts: ["action"]
    });
});

// TODO Add changing of badge color here
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "extension-on-off-ctx-menu") {
        const extensionOn = await getPreference("extensionOn");

        if (extensionOn) {
            chrome.contextMenus.update("extension-on-off-ctx-menu", {
                title: "Turn On"
            });

            // ? We should send msg to all tabs to remove the current visible search-container

            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { target: "tab", action: "extension-off" })
                        .catch(() => { }); // supress errors
                });
            });

        } else {
            chrome.contextMenus.update("extension-on-off-ctx-menu", {
                title: "Turn Off"
            });
        }

        chrome.storage.local.set({ extensionOn: !extensionOn });
    }
});