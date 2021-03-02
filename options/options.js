const KEY_PAUSED_SITES = 'paused-sites';

const pausedSitesTextarea = document.getElementById('paused-sites');
const saveButton = document.getElementById('save');

const storage = browser.storage.local;

function restoreOptions() {
    const toGet = {};
    toGet[KEY_PAUSED_SITES] = true;

    storage.get(toGet).then(keys => {
        pausedSitesTextarea.value = keys[KEY_PAUSED_SITES];
    }, error => {
        console.error('unable to fetch options: ' + error);
        textarea.innerText = 'DON\'T CLICK SAVE.\nERROR: ' + error;
    });
}

function saveSites(e) {
    e.preventDefault();

    const toSet = {};
    toSet[KEY_PAUSED_SITES] = pausedSitesTextarea.value;
    storage.set(toSet);

    browser.runtime.sendMessage({
        cmd: 'onSaveSites',
    });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
saveButton.addEventListener('click', saveSites);
