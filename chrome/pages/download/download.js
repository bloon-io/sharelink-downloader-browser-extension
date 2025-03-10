main = async function () {
    load_all_i18n_content();

    const shareId = new URLSearchParams(window.location.search).get('shareId');
    const sharelink_url = "http://www.bloon.io/share/" + shareId;

    document.title = chrome.i18n.getMessage("dl__downloading") + " " + sharelink_url;

    const headTextInfo = document.querySelector('#head-text-info');
    headTextInfo.textContent = chrome.i18n.getMessage("dl__preparing");

    const sharelinkDataManager = new SharelinkDataManager(shareId);
    const treeData = await sharelinkDataManager.retrieveCurrentRemoteTreeData()
    console.log(treeData);

    headTextInfo.textContent = chrome.i18n.getMessage("dl__start_dwonload_and_warn_text");
    headTextInfo.style.color = 'red';

    const totalNumDiv = document.querySelector('#total-num');
    const file_num = Object.keys(treeData.file_dict).length;
    totalNumDiv.textContent = file_num;

    // to show #file-list-zone
    const fileListZone = document.querySelector('#file-list-zone');
    fileListZone.style.display = 'block';

    // --------------------------------------------------
    init_show_table(treeData, shareId);

    // --------------------------------------------------
    download_next_file();
    download_next_file();
    download_next_file();
}

document.addEventListener('DOMContentLoaded', function () {
    main();
});

chrome.runtime.onMessage.addListener((action_msg, sender, sendResponse) => {
    if (action_msg.action === "update_tr") {
        do_update_tr(action_msg.params);

    }
});

// Intercept the close window event
window.addEventListener('beforeunload', function (event) {
    // event.preventDefault();
    // ------------------------------
    // Scan all tr with download_id attribute
    const download_ids = [];
    const trs = document.querySelectorAll('#file-list-tbody tr[download_id]');
    trs.forEach(tr => {
        download_ids.push(parseInt(tr.getAttribute('download_id')));
    });
    // ------------------------------
    const action_msg = {
        action: 'cancle_downloads',
        params: {
            download_ids: download_ids
        }
    }
    chrome.runtime.sendMessage(action_msg); // TODO Sometimes it fails in practice
});

load_all_i18n_content = function () {
    const elements = document.querySelectorAll('[i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('i18n');
        element.innerHTML = chrome.i18n.getMessage(key);
    });
}

increase_download_failed_num = function () {
    const downloadFailedNumDiv = document.querySelector('#download-failed-num');
    const download_failed_num = parseInt(downloadFailedNumDiv.textContent);
    downloadFailedNumDiv.textContent = download_failed_num + 1;
}

increase_downloaded_num = function () {
    const downloadedNumDiv = document.querySelector('#downloaded-num');
    const downloaded_num = parseInt(downloadedNumDiv.textContent);
    downloadedNumDiv.textContent = downloaded_num + 1;
}

do_update_tr = function (params) {
    const tr = document.querySelector('#' + params.tr_id);
    const status_td = tr.querySelector('td[name="status"]');

    tr.setAttribute('status', params.status);
    tr.setAttribute('download_id', params.download_id); // for canceling download

    if (params.status === 'in_progress') {
        status_td.textContent = params.persentage_str;
        status_td.style.backgroundColor = 'rgba(0, 0, 255, 0.3)'; // light blue

    } else if (params.status === 'complete') {
        status_td.textContent = chrome.i18n.getMessage("dl__download_completed");
        status_td.style.backgroundColor = 'rgba(0, 255, 0, 0.3)'; // light green
        // ------------------------------
        increase_downloaded_num();
        download_next_file();

    } else if (params.status === 'interrupted') {
        status_td.textContent = chrome.i18n.getMessage("dl__download_interrupted") + " (" + params.cause + ")";
        status_td.style.backgroundColor = 'rgba(255, 0, 0, 0.3)'; // light red
        // ------------------------------
        increase_download_failed_num();
        download_next_file();
    }

}

download_next_file = function () {
    const tr = document.querySelector('#file-list-tbody tr:not([status])');
    if (tr) {
        const download_url = tr.getAttribute('download_url');
        const file_rel_path_with_root = tr.getAttribute('file_rel_path_with_root');
        const action_msg = {
            action: 'download_a_file',
            params: {
                tr_id: tr.id,
                download_url: download_url,
                file_rel_path_with_root: file_rel_path_with_root
            }
        }
        chrome.runtime.sendMessage(action_msg);
        tr.setAttribute('status', 'just_started');

        const status_td = tr.querySelector('td[name="status"]');
        status_td.textContent = "0%";
        status_td.style.backgroundColor = 'rgba(0, 0, 255, 0.3)'; // light blue

        // Move the current tr to the top
        tr.parentNode.insertBefore(tr, tr.parentNode.firstChild);

    } else {
        console.log("All files downloaded.");

    }
}

init_show_table = function (treeData, shareId) {
    const fielListTbody = document.querySelector('#file-list-tbody');
    let count = 0;
    for (const file_rel_path_with_root in treeData.file_dict) {
        // const file_rel_path_without_root = file_rel_path_with_root.split('/').slice(1).join('/');
        // const download_url = "https://direct.bloon.io/share/" + shareId + "/" + file_rel_path_without_root;
        const card_id = treeData.file_dict[file_rel_path_with_root][2];
        const download_url = "https://direct.bloon.io/access/" + shareId + "?c=" + card_id + "&dl";

        const tr = document.createElement('tr');
        tr.id = 'file-list-tr-' + count;
        tr.setAttribute('download_url', download_url);
        tr.setAttribute('file_rel_path_with_root', file_rel_path_with_root);

        let td = null;

        td = document.createElement('td');
        td.setAttribute('name', 'status');
        td.textContent = chrome.i18n.getMessage("dl__in_queue");
        tr.appendChild(td);

        td = document.createElement('td');
        td.setAttribute('name', 'file_rel_path_with_root');
        td.textContent = file_rel_path_with_root;
        tr.appendChild(td);

        fielListTbody.appendChild(tr);

        // ------------------------------
        count++;
    }
}
