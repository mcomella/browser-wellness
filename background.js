const UNPAUSE_MILLIS = 15 /* min */ * 60 /* sec */ * 1000 /* millis */;

const pauseUrl = browser.runtime.getURL('pause.html');

var pausedTLDs = []; // set later.

var isAddonPaused = true;

function maybeRedirectRequest(request) {
    if (!isAddonPaused ||
            request.type != 'main_frame') {
        return;
    }

    const domain = new URL(request.url).host;
    const isDomainPaused = !!pausedTLDs.find(paused => domain.endsWith(paused));
    if (!isDomainPaused) {
        return;
    }

    // TODO: remove urls from history
    const encodedRequestUrl = encodeURI(request.url);
    const redirectUrl = pauseUrl + '?request=' + encodedRequestUrl;
    return {redirectUrl: redirectUrl};
}

function unpauseSite(site) {
    // todo: pause only specific uris.
    isAddonPaused = false;
    setTimeout(e => isAddonPaused = true, UNPAUSE_MILLIS);
}

function reloadSites() {
    browser.storage.local.get({pausedSites: true}).then(keys => {
        const sites = keys.pausedSites;
        pausedTLDs = sites.split('\n');
        console.debug('Paused TLDs loaded');
    }, error => {
        console.error('error reloading sites');
        console.error(error)
    });
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
