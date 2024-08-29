async function main() {
    const download_all_button = create_download_all_button();

    // --------------------------------------------------
    watch_and_show_download_all_button(download_all_button);

    // --------------------------------------------------
    const shareId = window.location.pathname.split('/').pop();
    console.log("shareId:", shareId);

    const manager = new BSDBE_RemoteTreeDataManager(shareId);
    const treeData = await manager.retrieveCurrentRemoteTreeData()
    console.log(treeData);
};

create_download_all_button = function () {
    const download_all_button = document.createElement('button');
    download_all_button.id = 'BSDBE_download_all_button';
    download_all_button.textContent = 'Download All';
    // download_all_button.disabled = true;

    download_all_button.addEventListener('click', async () => {
        alert("yo~ Download All");
    });

    download_all_button.title = 'This button is added by "BLOON Sharelink Downloader Browser Extension"';

    download_all_button.style.margin = '8px';
    download_all_button.style.width = '150px';
    download_all_button.style.fontSize = '16px';
    download_all_button.style.color = '#D74589';

    return download_all_button;
}

watch_and_show_download_all_button = function (download_all_button) {
    // Execute every time the DOM changes
    const observer = new MutationObserver(() => {
        show_download_all_button(download_all_button);
    });
    observer.observe(document, { subtree: true, childList: true });
}

show_download_all_button = function (download_all_button) {
    if (document.querySelector('#BSDBE_download_all_button')) {
        return;
    }
    // Do it again in case the page hasn't loaded parentElem yet.
    const interval_id = setInterval(function () {
        const parentElem = document.querySelector('.header-with-light-color');
        if (parentElem) {
            clearInterval(interval_id);
            parentElem.appendChild(download_all_button);
        }
    }, 100);
}

// --------------------------------------------------
main();
