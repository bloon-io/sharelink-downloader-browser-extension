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