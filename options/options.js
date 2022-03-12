const KEY_BLOCKED_SITES = 'blockedSites';
const KEY_MORNING_SITES = 'morningSites';
const KEY_PAUSED_SITES = 'pausedSites';

const blockedSitesTextarea = document.getElementById('blocked-sites');
const morningSitesTextarea = document.getElementById('morning-sites');
const pausedSitesTextarea = document.getElementById('paused-sites');
const saveButton = document.getElementById('save');

const storage = browser.storage.local;

function restoreOptions() {
    const toGet = {};
    toGet[KEY_BLOCKED_SITES] = true;
    toGet[KEY_MORNING_SITES] = true;
    toGet[KEY_PAUSED_SITES] = true;

    storage.get(toGet).then(keys => {
        blockedSitesTextarea.value = keys[KEY_BLOCKED_SITES];
        morningSitesTextarea.value = keys[KEY_MORNING_SITES];
        pausedSitesTextarea.value = keys[KEY_PAUSED_SITES];
    }, error => {
        console.error('unable to fetch options: ' + error);
        textarea.innerText = 'DON\'T CLICK SAVE.\nERROR: ' + error;
    });
}

function saveSites(e) {
    e.preventDefault();

    const toSet = {};
    toSet[KEY_BLOCKED_SITES] = blockedSitesTextarea.value;
    toSet[KEY_MORNING_SITES] = morningSitesTextarea.value;
    toSet[KEY_PAUSED_SITES] = pausedSitesTextarea.value;
    storage.set(toSet);

    browser.runtime.sendMessage({
        cmd: 'onSaveSites',
    });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
saveButton.addEventListener('click', saveSites);
