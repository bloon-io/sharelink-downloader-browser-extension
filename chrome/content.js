async function main() {
    background_init();
};

background_init = function () {
    const action_msg = {
        action: 'background_init',
        params: {
            window_location: window.location
        }
    }
    chrome.runtime.sendMessage(action_msg);
}

// --------------------------------------------------
main();

//////////////////////////////////////////////////

// download_all_click_action = async function () {
//     const button = document.querySelector('#BSDBE_download_all_button');
//     make_button_disabled(button);

//     button.textContent = 'Preparing...';

//     // --------------------------------------------------
//     const shareId = window.location.pathname.split('/').pop();
//     console.log("shareId:", shareId);

//     const manager = new BSDBE_SharelinkDataManager(shareId);
//     const treeData = await manager.retrieveCurrentRemoteTreeData()
//     console.log(treeData);

//     // --------------------------------------------------
//     // for all files in file_dict, file_dict is key of treeData
//     for (const file_rel_path_with_root in treeData.file_dict) {
//         // const file_rel_path_without_root = file_rel_path_with_root.split('/').slice(1).join('/');
//         // const download_url = "https://direct.bloon.io/share/" + shareId + "/" + file_rel_path_without_root;
//         const card_id = treeData.file_dict[file_rel_path_with_root][2];
//         const download_url = "https://direct.bloon.io/access/" + shareId + "?c=" + card_id + "&dl";
//         const action_msg = {
//             action: 'download',
//             params: {
//                 download_url: download_url,
//                 file_rel_path_with_root: file_rel_path_with_root
//             }
//         }
//         chrome.runtime.sendMessage(action_msg);
//     }

//     // --------------------------------------------------
//     button.textContent = 'Download All';
//     make_button_enabled(button);
// }

// make_button_disabled = function (button) {
//     button.disabled = true;
//     button.style.color = '#FFA3C1';
// }

// make_button_enabled = function (button) {
//     button.disabled = false;
//     button.style.color = '#D74589';
// }

// create_download_all_button = function () {
//     const button = document.createElement('button');
//     button.id = 'BSDBE_download_all_button';
//     button.textContent = 'Download All';
//     // download_all_button.disabled = true;

//     button.addEventListener('click', download_all_click_action);

//     button.title = 'This button is added by "BLOON Sharelink Downloader Browser Extension"';

//     button.style.margin = '8px';
//     button.style.width = '150px';
//     button.style.fontSize = '16px';
//     button.style.color = '#D74589';

//     return button;
// }

// watch_and_show_download_all_button = function () {
//     const button = create_download_all_button();
//     // Execute every time the DOM changes
//     const observer = new MutationObserver(() => {
//         show_download_all_button(button);
//     });
//     observer.observe(document, { subtree: true, childList: true });
// }

// show_download_all_button = function (download_all_button) {
//     if (document.querySelector('#BSDBE_download_all_button')) {
//         return;
//     }
//     // Do it again in case the page hasn't loaded parentElem yet.
//     const interval_id = setInterval(function () {
//         const parentElem = document.querySelector('.header-with-light-color');
//         if (parentElem) {
//             clearInterval(interval_id);
//             parentElem.appendChild(download_all_button);
//         }
//     }, 100);
// }
