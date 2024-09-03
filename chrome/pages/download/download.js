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

    init_show_table(treeData, shareId);

    download_next_file();

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
        tr.setAttribute('status', 'downloading');

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
        td.textContent = "排隊中..."; // TODO i18n
        tr.appendChild(td);

        td = document.createElement('td');
        td.textContent = file_rel_path_with_root;
        tr.appendChild(td);

        fielListTbody.appendChild(tr);
    }
}

// --------------------------------------------------
main();
