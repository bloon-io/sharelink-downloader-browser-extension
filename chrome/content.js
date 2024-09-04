async function main() {
    tab_init_in_background();
};

tab_init_in_background = function () {
    const action_msg = {
        action: 'tab_init_in_background',
        params: {
            window_location: window.location
        }
    }
    chrome.runtime.sendMessage(action_msg);
}

// --------------------------------------------------
main();
