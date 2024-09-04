main = async function () {
    const shareId = new URLSearchParams(window.location.search).get('shareId');
    const sharelink_url = "http://www.bloon.io/share/" + shareId;

    document.title = "下載來自 " + sharelink_url + " 的檔案"; // TODO i18n

    const headInfo = document.querySelector('#head-info');
    headInfo.textContent = "解析中，請稍候..."; // TODO i18n

    const sharelinkDataManager = new SharelinkDataManager(shareId);
    const treeData = await sharelinkDataManager.retrieveCurrentRemoteTreeData()
    console.log(treeData);

    const file_num = Object.keys(treeData.file_dict).length;

    headInfo.textContent = "共 " + file_num + " 個檔案"; // TODO i18n

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

chrome.runtime.onMessage.addListener((action_msg, sender, sendResponse) => {
    if (action_msg.action === "update_tr") {
        do_update_tr(action_msg.params);

    }
});

do_update_tr = function (params) {
    const tr = document.querySelector('#' + params.tr_id);
    const status_td = tr.querySelector('td[name="status"]');

    tr.setAttribute('status', params.status);

    if (params.status === 'in_progress') {
        status_td.textContent = params.persentage_str;
        status_td.style.backgroundColor = 'rgba(0, 0, 255, 0.3)'; // light blue

    } else if (params.status === 'complete') {
        status_td.textContent = "下載完成"; // TODO i18n
        status_td.style.backgroundColor = 'rgba(0, 255, 0, 0.3)'; // light green
        // ------------------------------
        download_next_file();

    } else if (params.status === 'interrupted') {
        status_td.textContent = "下載中斷（" + params.cause + "）"; // TODO i18n
        status_td.style.backgroundColor = 'rgba(255, 0, 0, 0.3)'; // light red
        // ------------------------------
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
        td.textContent = "排隊中..."; // TODO i18n
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

// --------------------------------------------------
main();
