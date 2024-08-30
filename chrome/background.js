chrome.runtime.onMessage.addListener((action_msg, sender, sendResponse) => {
    if (action_msg.action === 'download') {
        do_download_action(action_msg.params);
    }
});

do_download_action = function (params) {
    const DOWNLOAD_HOME_NAME = 'BLOON_sharelink_downloader';
    // --------------------------------------------------
    const download_url = params.download_url;
    const file_rel_path_with_root = params.file_rel_path_with_root;
    const download_path = DOWNLOAD_HOME_NAME + '/' + file_rel_path_with_root;
    chrome.downloads.download({
        url: download_url,
        filename: download_path

    }, function (download_id) {
        // console.log("download_id:", download_id);
        chrome.downloads.onChanged.addListener(function tmp_onChanged_func(delta) {
            if (delta.id === download_id) {
                if (delta.state) {
                    // console.log("delta.state.current:", delta.state.current);
                    if (delta.state.current === 'complete') {
                        console.log("Download completed:", download_id);

                    } else if (delta.state.current === 'interrupted') {
                        // Wait a moment to ensure that the download information has been recorded
                        setTimeout(() => {
                            chrome.downloads.search({ id: download_id }, (results) => {
                                if (results && results.length > 0) {
                                    const download_item = results[0];
                                    // console.log("Download interrupted, download_item:", download_item);
                                    console.log("Download interrupted, url:", download_item.url);
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
    });
}
