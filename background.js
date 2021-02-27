const pauseUrl = browser.runtime.getURL('pause.html');

const pausedTLDs = [
    'foxnews.com',
    'nytimes.com',
    'economist.com'
];

let unpausedTLDs = {
    
};

function maybeRedirectRequest(request) {
    if (request.type != 'main_frame') {
        return;
    }

    console.log(request);
    let domain = new URL(request.url).host;
    console.log(domain);
    let isDomainPaused = pausedTLDs.find(paused => domain.endsWith(paused)).length > 0;
    if (!isDomainPaused) {
        return;
    }

    return {redirectUrl: pauseUrl};
}

browser.webRequest.onBeforeRequest.addListener(
    maybeRedirectRequest,
    {urls: ["<all_urls>"]}, // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
    ["blocking"]
);
