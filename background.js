const UNPAUSE_MINS = 15;
const UNPAUSE_MILLIS = UNPAUSE_MINS * 60 /* sec */ * 1000 /* millis */;

const pauseUrl = browser.runtime.getURL('pause.html'); // cached just in case many requests are made.

var userPausedSites = new Map(); // set later.

function maybeRedirectRequest(request) {
    if (request.type != 'main_frame') {
        return;
    }

    const userPausedSite = getUserPausedSiteFromUrl(request.url);
    const isSitePaused = userPausedSite && !userPausedSite.isUnpaused;
    if (!isSitePaused) {
        return;
    }

    // TODO: remove urls from history
    const encodedRequestUrl = encodeURI(request.url);
    const redirectUrl = pauseUrl + '?request=' + encodedRequestUrl;
    return {redirectUrl: redirectUrl};
}

function unpauseSite(site) {
    console.debug(`unpausing site for ${UNPAUSE_MINS} minutes: ${site}`);
    const userPausedSite = getUserPausedSiteFromUrl(site);
    if (!userPausedSite) {
        console.error(`Unexpectedly unable to unpause, site not found: ${site}`);
        return;
    }

    userPausedSite.isUnpaused = true;
    setTimeout(e => {
        console.debug(`pausing site: ${site}`);
        userPausedSite.isUnpaused = false;
    }, UNPAUSE_MILLIS);
}

function reloadSites() {
    browser.storage.local.get({pausedSites: true}).then(keys => {
        userPausedSites = new Map(); // reset data structure.

        const sitesOnDisk = keys.pausedSites.split('\n');
        sitesOnDisk.forEach(site => {
            userPausedSites.set(site, {
                isUnpaused: false,
            });
        });
        console.debug('Paused TLDs loaded');
    }, error => {
        console.error('error reloading sites');
        console.error(error)
    });
}

function getUserPausedSiteFromUrl(url) {
    const domain = new URL(url).host;
    const matchingKey = Array.from(userPausedSites.keys()).find(paused => domain.endsWith(paused));
    if (!matchingKey) {
        return null;
    }
    return userPausedSites.get(matchingKey);
}

function onMessage(message, sender, sendResponse) {
    if (message.cmd === 'unpauseSite') {
        unpauseSite(message.value);
    } else if (message.cmd === 'onSaveSites') {
        reloadSites();
    }
}

reloadSites();
browser.runtime.onMessage.addListener(onMessage);
browser.webRequest.onBeforeRequest.addListener(
    maybeRedirectRequest,
    {urls: ["<all_urls>"]}, // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
    ["blocking"]
);
