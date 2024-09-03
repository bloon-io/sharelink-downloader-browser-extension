importScripts('api.js');

chrome.runtime.onMessage.addListener((action_msg, sender, sendResponse) => {
    if (action_msg.action === 'tab_init_in_background') {
        tab_init_in_background(action_msg.params, sender.tab);

    } else if (action_msg.action === 'download_a_file') {
        download_a_file(action_msg.params);

    }
});

tab_init_in_background = async function (params, tab) {
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
                    "16": "images/sharelink-enable-for-extenstion-icon_16x16_51B749_bgTR.png",
                    "48": "images/sharelink-enable-for-extenstion-icon_48x48_51B749_bgTR.png",
                    "128": "images/sharelink-enable-for-extenstion-icon_128x128_51B749_bgTR.png"
                },
                tabId: tab.id
            });

            // force to show popup
            chrome.action.openPopup();

        }

    } else {
        // to make icon appear as gray
        chrome.action.setIcon({
            path: {
                "16": "images/sharelink-gray-for-extenstion-icon_16x16_878787_bgTR.png",
                "48": "images/sharelink-gray-for-extenstion-icon_48x48_878787_bgTR.png",
                "128": "images/sharelink-gray-for-extenstion-icon_128x128_878787_bgTR.png"
            },
            tabId: tab.id
        });

    }
}

download_a_file = function (params) {
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
        // console.log("download_id:", download_id);
        chrome.downloads.onChanged.addListener(function tmp_onChanged_func(delta) {
            if (delta.id === download_id) {
                if (delta.state) {
                    console.log("delta.state.current:", delta.state.current);
                    if (delta.state.current === 'complete') {
                        console.log("Download completed:", download_id);

                    } else if (delta.state.current === 'interrupted') {
                        // Wait a moment to ensure that the download information has been recorded
                        setTimeout(() => {
                            chrome.downloads.search({ id: download_id }, (results) => {
                                if (results && results.length > 0) {
                                    const download_item = results[0];
                                    // console.log("Download interrupted, download_item:", download_item);
                                    console.warn("Download interrupted, url:", download_item.url);
                                    // console.log("Filename:", download_item.filename);
                                    // console.log("Total bytes:", download_item.totalBytes);
                                    // console.log("Received bytes:", download_item.bytesReceived);
                                    // console.log("====================================");
                                } else {
                                    console.log("Download not found");
                                }
                            });
                        }, 1000);

                    }
                    // --------------------------------------------------
                    chrome.downloads.onChanged.removeListener(tmp_onChanged_func);
                }
            }
        });

        // TODO now-here 1

        // Set an interval to periodically check the download progress
        const intervalId = setInterval(() => {
            chrome.downloads.search({ id: downloadId }, function (results) {
                if (results && results[0]) {
                    const downloadItem = results[0];
                    if (downloadItem.state === 'in_progress' && downloadItem.totalBytes > 0) {
                        const progress = (downloadItem.bytesReceived / downloadItem.totalBytes) * 100;
                        console.log('下載進度: ' + progress.toFixed(2) + '%');
                    } else if (downloadItem.state === 'complete') {
                        console.log('下載完成！');
                        clearInterval(intervalId); // 下載完成，停止檢查
                    } else if (downloadItem.state === 'interrupted') {
                        console.log('下載中斷: ' + downloadItem.error);
                        clearInterval(intervalId); // 下載中斷，停止檢查
                    }
                }
            });
        }, 1000); // 每秒檢查一次
    });
}
