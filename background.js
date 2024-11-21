// cached just in case many requests are made.
const blockedUrl = browser.runtime.getURL('blocked.html');
const pauseUrl = browser.runtime.getURL('pause.html');

// These are set later.
var userBlockedSites = [];
var userPausedSites = [];

function maybeRedirectRequest(request) {
    if (request.type != 'main_frame') {
        return;
    }

    // This logic is duplicated for pause in getUserPausedSiteFromUrl.
    const urlNoProtocol = removeUrlProtocol(request.url);
    const isSiteBlocked = userBlockedSites.find(site => urlNoProtocol.startsWith(site));
    if (isSiteBlocked) {
        return {redirectUrl: blockedUrl};
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

function removeUrlProtocol(str) {
    const url = new URL(str);
    const protocolLen = url.protocol.length + 2; // +2 to add '//' divider.
    return str.slice(protocolLen);
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
        blockedSites: false, // these will be the default values if the keys are not found.
        pausedSites: false,
    };
    browser.storage.local.get(toGet).then(keys => {
        userBlockedSites = !keys.blockedSites ? [] : keys.blockedSites.split('\n');
        userPausedSites = !keys.pausedSites ? [] : keys.pausedSites.split('\n').map(site => { return {
            site,
            unpauseUntil: new Date(),
        };})
        console.debug('Paused TLDs loaded');
    }, error => {
        console.error('error reloading sites');
        console.error(error)
    });
}

function getUserPausedSiteFromUrl(url) {
    // This logic is duplicated for blockedSites in maybeRedirectRequest.
    const urlNoProtocol = removeUrlProtocol(url);
    return userPausedSites.find(({site}) => urlNoProtocol.startsWith(site));
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
