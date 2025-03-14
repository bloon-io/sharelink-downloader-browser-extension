importScripts('api.js');

chrome.runtime.onMessage.addListener((action_msg, sender, sendResponse) => {
    if (action_msg.action === 'tab_init_in_background') {
        do_tab_init_in_background(action_msg.params, sender.tab);

    } else if (action_msg.action === 'download_a_file') {
        do_download_a_file(action_msg.params, sender.tab);

    } else if (action_msg.action === 'cancle_downloads') {
        do_cancle_downloads(action_msg.params, sender.tab);

    }
});

do_cancle_downloads = function (params, tab) {
    const download_ids = params.download_ids;
    download_ids.forEach(download_id => {
        console.log("cancle download_id:", download_id);
        chrome.downloads.cancel(download_id);
    });
}

do_tab_init_in_background = async function (params, tab) {
    const shareId = params.window_location.pathname.split('/').pop();
    console.log("shareId:", shareId);

    const sharelinkDataManager = new SharelinkDataManager(shareId);
    const isFolder = await sharelinkDataManager.isFolder();
    console.log("isFolder:", isFolder);

    _determine_correct_icon_and_popup(params, tab, isFolder, shareId);
}

_determine_correct_icon_and_popup = async function (params, tab, isFolder, shareId) {
    // Detect if the current page matches https://www.bloon.io/share*
    if (params.window_location.hostname === 'www.bloon.io' && params.window_location.pathname.startsWith('/share')) {

        // it must also be a folder to display popup-enabled.html
        if (isFolder) {
            chrome.action.setPopup({
                popup: "pages/popup-enabled/popup-enabled.html?shareId=" + shareId,
                tabId: tab.id
            });

            // to make icon appear as green
            chrome.action.setIcon({
                path: {
                    "16": "images/sharelink-enable-for-extension-icon_16x16_51B749_bgTR.png",
                    "48": "images/sharelink-enable-for-extension-icon_48x48_51B749_bgTR.png",
                    "128": "images/sharelink-enable-for-extension-icon_128x128_51B749_bgTR.png"
                },
                tabId: tab.id
            });

            // Determine whether to open the popup automatically by isAutoPopup
            chrome.storage.local.get(['isAutoPopup'], function (result) {
                // default is to open popup automatically
                if (result.isAutoPopup === undefined) {
                    chrome.storage.local.set({ isAutoPopup: true }, () => {
                        chrome.action.openPopup();
                    });
                } else if (result.isAutoPopup) {
                    chrome.action.openPopup();
                }
            });
        }

    } else {
        // to make icon appear as gray
        chrome.action.setIcon({
            path: {
                "16": "images/sharelink-gray-for-extension-icon_16x16_878787_bgTR.png",
                "48": "images/sharelink-gray-for-extension-icon_48x48_878787_bgTR.png",
                "128": "images/sharelink-gray-for-extension-icon_128x128_878787_bgTR.png"
            },
            tabId: tab.id
        });

    }
}

do_download_a_file = function (params, tab) {
    const DOWNLOAD_HOME_NAME = 'BLOON_sharelink_downloader';
    // --------------------------------------------------
    const download_url = params.download_url;
    const file_rel_path_with_root = params.file_rel_path_with_root;
    const tr_id = params.tr_id;
    // --------------------------------------------------
    const download_path = DOWNLOAD_HOME_NAME + '/' + file_rel_path_with_root;
    chrome.downloads.download({
        url: download_url,
        filename: download_path
    }, function (download_id) {
        // Set an interval to periodically check the download progress
        const intervalId = setInterval(() => {
            chrome.downloads.search({
                id: download_id
            }, function (results) {
                if (results && results[0]) {
                    const download_info = results[0];
                    if (download_info.state === 'in_progress' && download_info.totalBytes > 0) {
                        const progress = (download_info.bytesReceived / download_info.totalBytes) * 100;
                        const persentage_str = progress.toFixed(2) + '%';
                        // ------------------------------
                        const action_msg = {
                            action: 'update_tr',
                            params: {
                                tr_id: tr_id,
                                download_id: download_id,
                                status: 'in_progress',
                                persentage_str: persentage_str
                            }
                        }
                        chrome.tabs.sendMessage(tab.id, action_msg).then((response) => {
                            // do nothing
                        }).catch((error) => {
                            console.warn('Error sending message, but that is ok:', error);
                        });

                    } else if (download_info.state === 'complete') {
                        clearInterval(intervalId); // to stop checking
                        // ------------------------------
                        const action_msg = {
                            action: 'update_tr',
                            params: {
                                tr_id: tr_id,
                                download_id: download_id,
                                status: 'complete'
                            }
                        }
                        chrome.tabs.sendMessage(tab.id, action_msg).then((response) => {
                            // do nothing
                        }).catch((error) => {
                            console.warn('Error sending message, but that is ok:', error);
                        });

                    } else if (download_info.state === 'interrupted') {
                        clearInterval(intervalId); // to stop checking
                        // ------------------------------
                        const action_msg = {
                            action: 'update_tr',
                            params: {
                                tr_id: tr_id,
                                download_id: download_id,
                                status: 'interrupted',
                                cause: download_info.error
                            }
                        }
                        chrome.tabs.sendMessage(tab.id, action_msg).then((response) => {
                            // do nothing
                        }).catch((error) => {
                            console.warn('Error sending message, but that is ok:', error);
                        });

                    }
                }
            });
        }, 1000); // Check every second
    });
}
