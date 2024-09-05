main = function () {
    load_all_i18n_content();
}

document.addEventListener('DOMContentLoaded', function () {
    main();
});

load_all_i18n_content = function () {
    const elements = document.querySelectorAll('[i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('i18n');
        element.innerHTML = chrome.i18n.getMessage(key);
    });
}
