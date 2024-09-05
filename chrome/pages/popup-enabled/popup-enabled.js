main = function () {
    load_all_i18n_content();

    const autoPopupCheckbox = document.getElementById('auto-popup-checkbox');
    chrome.storage.local.get(['isAutoPopup'], function (result) {
        if (result.isAutoPopup === undefined) {
            // default is to open popup automatically
            chrome.storage.local.set({ isAutoPopup: true }, () => {
                autoPopupCheckbox.checked = true;
            });
        } else {
            autoPopupCheckbox.checked = result.isAutoPopup;
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    main();
});

load_all_i18n_content = function () {
    const elements = document.querySelectorAll('[i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('i18n');
        element.innerHTML = chrome.i18n.getMessage(key);
    });
}

document.getElementById('auto-popup-checkbox').addEventListener('change', function () {
    chrome.storage.local.set({ isAutoPopup: this.checked });
});

document.getElementById('download-btn').addEventListener('click', function () {
    // to close self popup window
    window.close();

    const shareId = new URLSearchParams(window.location.search).get('shareId');
    chrome.windows.getCurrent(function (currentWindow) {
        // console.log(currentWindow.top);
        // console.log(currentWindow.left);
        chrome.windows.create({
            url: 'pages/download/download.html?shareId=' + shareId,
            type: 'popup',
            width: 800,
            height: 600,
            top: currentWindow.top + 100,
            left: currentWindow.left + 100,
        });
    });
});
