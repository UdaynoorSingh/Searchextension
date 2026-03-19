import { getPreference } from "../_lib/utils";

chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: "extension-on-off-ctx-menu",
        title: "Turn Off",
        contexts: ["action"]
    });

    chrome.contextMenus.create({
        id: "tips-tricks-and-help-page-ctx-menu",
        title: "Tips, Tricks and Help",
        contexts: ["action"]
    });

    chrome.contextMenus.create({
        id: "thank-you-and-credits-page-ctx-menu",
        title: "Thank you, Credits and a Message",
        contexts: ["action"]
    });

    if (await getPreference("hasBoarded")) {
        chrome.contextMenus.create({
            id: "playground-ctx-menu",
            title: "Playground",
            contexts: ["action"]
        });
    }
    else {
        chrome.contextMenus.create({
            id: "playground-ctx-menu",
            title: "Boarding Page",
            contexts: ["action"]
        });
    }

});

// TODO Add changing of badge color here
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    switch (info.menuItemId) {
        case "extension-on-off-ctx-menu":
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
            break;


        case "thank-you-and-credits-page-ctx-menu":
            chrome.tabs.create({
                url: chrome.runtime.getURL("page-thank-you-and-credits/index.html")
            });
            break;

        case "tips-tricks-and-help-page-ctx-menu":
            chrome.tabs.create({
                url: chrome.runtime.getURL("page-tips-tricks-and-help/index.html")
            });
            break;

        case "playground-ctx-menu":

            chrome.tabs.create({ url: chrome.runtime.getURL("page-boarding/dist/index.html") });
            break;


        default:
            break;
    }

});