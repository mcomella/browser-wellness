// cached just in case many requests are made.
const blockedUrl = browser.runtime.getURL('blocked.html');
const pauseUrl = browser.runtime.getURL('pause.html');

// These are set later.
let userBlockedSites = [];
let userBlockedIncludes = [];
let userPausedSites = [];
let userPausedIncludes = [];

function maybeRedirectRequest(request) {
    if (request.type != 'main_frame') {
        return;
    }

    const redirectUrl = getRedirectUrl(request.url);
    if (redirectUrl) {
        return {redirectUrl: redirectUrl};
    }
}

async function onHistoryStateUpdated(details) {
    if (details.frameId !== 0) { // we only look at top-level browsing context.
        return;
    }

    const redirectUrl = getRedirectUrl(details.url);
    if (redirectUrl) {
        browser.tabs.update(details.tabId, {
            url: redirectUrl,
        });
    }
}

function getRedirectUrl(url) {
    // This logic is duplicated for pause in getUserPausedSiteFromUrl.
    const isSiteBlocked = getRestrictedSite(userBlockedSites, userBlockedIncludes, (s) => s, url);
    if (isSiteBlocked) {
        return blockedUrl;
    }

    const userPausedSite = getUserPausedSiteFromUrl(url);
    const isSitePaused = userPausedSite && userPausedSite.unpauseUntil < new Date();
    if (!isSitePaused) {
        return;
    }

    const encodedRequestUrl = encodeURI(url);
    const redirectUrl = pauseUrl + '?request=' + encodedRequestUrl;
    return redirectUrl;
}

function getRestrictedSite(restrictedSites, includedSites, getUrl, site) {
    function cleanUpUrl() {
        let url = new URL(site);

        // Remove protocol.
        const protocolLen = url.protocol.length + 2; // +2 to add '//' divider.
        url = site.slice(protocolLen);

        if (url.startsWith('www.')) {
            url = url.slice('www.'.length);
        }

        return url;
    }

    const urlCleaned = cleanUpUrl(site);
    let longestBlockedSite = false;
    let longestBlockedLen = 0;
    for (let restrictedSite of restrictedSites) {
        const restrictedUrl = getUrl(restrictedSite);
        if (urlCleaned.startsWith(restrictedUrl) && restrictedUrl.length > longestBlockedLen) {
            longestBlockedSite = restrictedSite;
            longestBlockedLen = restrictedUrl.length;
        }
    }

    if (!longestBlockedSite) {
        return false;
    }

    let longestInclude = '';
    for (let site of includedSites) {
        if (urlCleaned.startsWith(site) && site.length > longestInclude.length) {
            longestInclude = site;
        }
    }

    if (longestInclude.length > getUrl(longestBlockedSite).length) {
        console.debug('include overrides blocked site');
        return false;
    }
    return longestBlockedSite;
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
        const blockedSites = !keys.blockedSites ? [] : keys.blockedSites.split('\n');
        userBlockedSites = blockedSites.filter(site => !site.startsWith('+'));
        userBlockedIncludes = blockedSites.filter(site => site.startsWith('+')).map(site => site.slice(1));

        const pausedSites = !keys.pausedSites ? [] : keys.pausedSites.split('\n');
        userPausedIncludes = pausedSites.filter(site => site.startsWith('+')).map(site => site.slice(1));
        userPausedSites = pausedSites.filter(site => !site.startsWith('+')).map(site => { return {
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
    return getRestrictedSite(userPausedSites, userPausedIncludes, (s) => s.site, url);
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

// TODO: we can add a URL filter which may be more performant.
browser.webNavigation.onHistoryStateUpdated.addListener(onHistoryStateUpdated);