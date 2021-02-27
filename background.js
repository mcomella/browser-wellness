const UNPAUSE_MILLIS = 15 /* min */ * 60 /* sec */ * 1000 /* millis */;

const pauseUrl = browser.runtime.getURL('pause.html');

const pausedTLDs = [
    'foxnews.com',
    'nytimes.com',
    'economist.com',
    'boardgamegeek.com',
    'reddit.com',
];

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

    const encodedRequestUrl = encodeURI(request.url);
    const redirectUrl = pauseUrl + '?request=' + encodedRequestUrl;
    return {redirectUrl: redirectUrl};
}

function onMessage(message, sender, sendResponse) {
    console.log('message ' + message);
    // todo: validate it's the right message.

    // todo: pause only specific uris.
    isAddonPaused = false;
    setTimeout(e => isAddonPaused = true, UNPAUSE_MILLIS);
}

browser.runtime.onMessage.addListener(onMessage);
browser.webRequest.onBeforeRequest.addListener(
    maybeRedirectRequest,
    {urls: ["<all_urls>"]}, // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
    ["blocking"]
);
