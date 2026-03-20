const a = document.getElementById("options-page-a");

a.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL("page-options/dist/index.html") });
});