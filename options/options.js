const KEY_BLOCKED_SITES = 'blockedSites';
const KEY_PAUSED_SITES = 'pausedSites';

const blockedSitesTextarea = document.getElementById('blocked-sites');
const pausedSitesTextarea = document.getElementById('paused-sites');
const saveButton = document.getElementById('save');

const storage = browser.storage.local;

function restoreOptions() {
    const toGet = {
        blockedSites: false, // these will be the default values if the keys are not found.
        pausedSites: false,
    };

    storage.get(toGet).then(keys => {
        if (keys.blockedSites) {
            blockedSitesTextarea.value = keys.blockedSites;
        }
        if (keys.pausedSites) {
            pausedSitesTextarea.value = keys.pausedSites;
        }
    }, error => {
        console.error('unable to fetch options: ' + error);
        blockedSitesTextarea.innerText = 'DON\'T CLICK SAVE.\nERROR: ' + error;
    });
}

function saveSites(e) {
    e.preventDefault();
    storage.set({
        blockedSites: blockedSitesTextarea.value,
        pausedSites: pausedSitesTextarea.value,
    });
    browser.runtime.sendMessage({
        cmd: 'onSaveSites',
    });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
saveButton.addEventListener('click', saveSites);
