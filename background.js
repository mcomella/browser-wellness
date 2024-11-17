const MORNING_START = new Date(1900, 1, 1, /* hours */ 7);
const MORNING_END = new Date(1900, 1, 1, /* hours */ 10);

// cached just in case many requests are made.
const blockedUrl = browser.runtime.getURL('blocked.html');
const pauseUrl = browser.runtime.getURL('pause.html');

// These are set later.
var userBlockedSites = [];
var userMorningSites = [];
var userPausedSites = new Map();

function maybeRedirectRequest(request) {
    if (request.type != 'main_frame') {
        return;
    }

    const requestDomain = new URL(request.url).host;
    const isSiteBlocked = userBlockedSites.find(site => requestDomain.endsWith(site));
    if (isSiteBlocked) {
        return {redirectUrl: blockedUrl};
    }

    const isMorningSite = userMorningSites.find(site => requestDomain.endsWith(site));
    if (isMorningSite) {
        const timeNow = new Date();
        timeNow.setFullYear(1900, 1, 1); // set dmy equal so we can compare times only.
        const isMorning = timeNow >= MORNING_START && timeNow <= MORNING_END;
        if (!isMorning) {
            return {redirectUrl: blockedUrl};
        }
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
    const toGet = {
        blockedSites: true,
        morningSites: true,
        pausedSites: true,
    };
    browser.storage.local.get(toGet).then(keys => {
        userBlockedSites = keys.blockedSites ? keys.blockedSites.split('\n') : [];
        userMorningSites = keys.morningSites ? keys.morningSites.split('\n') : [];

        userPausedSites = new Map(); // reset data structure.

        // TODO: keys.pausedSites.split not a function if not loaded from disk.
        const pausedSitesOnDisk = keys.pausedSites.split('\n');
        pausedSitesOnDisk.forEach(site => {
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
