import { getPreference } from "../_lib/utils.js";

function showRatingsNotification() {
    chrome.notifications.create("ask-for-ratings-notification", {
        type: 'basic',
        iconUrl: '/assets/ratings-icon.png',
        title: 'Liking it so far?',
        message: 'Please rate it on web store.',
        buttons: [
            { title: 'Rate' },
            { title: 'Later' },
        ],
        requireInteraction: true
    });
};

let notificationClosedViaUserClick = false;

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {

    if (notificationId === "ask-for-ratings-notification") {

        switch (buttonIndex) {
            // ? Rate button
            case 0:
                {
                    chrome.tabs.create({
                        // TODO: change link
                        url: "https://chromewebstore.google.com/detail/retro-pokemon-themes-brin/emofnbdnchknpahlndbocpnibddpebbe/reviews"
                    });
                    chrome.alarms.clear("ask-for-ratings-alarm");
                    break;

                    // ? Later button
                }
            case 1:
                {
                    const askForRatingsAlarmLimit = await getPreference("askForRatingsAlarmLimit");

                    chrome.alarms.create("ask-for-ratings-alarm", {
                        delayInMinutes: askForRatingsAlarmLimit * 24 * 60
                    });

                    chrome.storage.local.set({ "askForRatingsAlarmLimit": (askForRatingsAlarmLimit * 2) });
                    break;
                }
            default:
                break;
        }

        notificationClosedViaUserClick = true;
        chrome.notifications.clear("ask-for-ratings-notification");
    }
});

chrome.notifications.onClosed.addListener(async (notificationId, byUser) => {


    switch (notificationId) {
        case "ask-for-ratings-notification": {

            if (byUser) {
                const askForRatingsAlarmLimit = await getPreference("askForRatingsAlarmLimit");

                chrome.alarms.create("ask-for-ratings-alarm", {
                    delayInMinutes: askForRatingsAlarmLimit * 24 * 60
                });
                chrome.storage.local.set({ "askForRatingsAlarmLimit": askForRatingsAlarmLimit * 2 });
            }
            else {
                // ? Notifications closed via button(not cross button) clicks also come here 
                if (!notificationClosedViaUserClick) {

                    // ? If OS dismissed the notification then show it after 1 day
                    chrome.alarms.create("ask-for-ratings-alarm", {
                        delayInMinutes: 1 * 24 * 60
                    });
                }
            }

            notificationClosedViaUserClick = false;
            break;
        }
        default:
            break;
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "ask-for-ratings-alarm") {
        showRatingsNotification();
    }
});