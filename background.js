const pauseUrl = browser.runtime.getURL('pause.html'); // cached just in case many requests are made.

var userPausedSites = new Map(); // set later.

function maybeRedirectRequest(request) {
    if (request.type != 'main_frame') {
        return;
    }

    const userPausedSite = getUserPausedSiteFromUrl(request.url);
    const isSitePaused = userPausedSite && userPausedSite.unpauseUntil < new Date();
    if (!isSitePaused) {
        return;
    }

    // TODO: remove urls from history
    const encodedRequestUrl = encodeURI(request.url);
    const redirectUrl = pauseUrl + '?request=' + encodedRequestUrl;
    return {redirectUrl: redirectUrl};
}

function unpauseSite(siteObj) {
    const url = siteObj.url;
    const userPausedSite = getUserPausedSiteFromUrl(url);
    if (!userPausedSite) {
        console.error(`Unexpectedly unable to unpause, site not found: ${url}`);
        return;
    }

    const unpauseMin = siteObj.unpauseMin;
    const unpauseMillis = unpauseMin * 60 /* seconds */ * 1000 /* millis */;

    const now = new Date();
    userPausedSite.unpauseUntil = new Date(now.getTime() + unpauseMillis);
    console.debug(`unpausing site for ${unpauseMin} minutes until ${userPausedSite.unpauseUntil}: ${url}`);
}

function reloadSites() {
    browser.storage.local.get({pausedSites: true}).then(keys => {
        userPausedSites = new Map(); // reset data structure.

        // TODO: keys.pausedSites.split not a function if not loaded from disk.
        const sitesOnDisk = keys.pausedSites.split('\n');
        sitesOnDisk.forEach(site => {
            userPausedSites.set(site, {
                unpauseUntil: new Date(),
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
