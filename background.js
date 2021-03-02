const UNPAUSE_MILLIS = 15 /* min */ * 60 /* sec */ * 1000 /* millis */;

const pauseUrl = browser.runtime.getURL('pause.html');

// TODO: add as preference file
const pausedTLDs = [
    'allsides.com',
    'boardgamegeek.com',
    'dicebreaker.com',
    'dicetower.com',
    'economist.com',
    'foxnews.com',
    'games-workshop.com',
    'gamestop.com',
    'instagram.com',
    'kotaku.com',
    'meeplelikeus.co.uk/',
    'newegg.com',
    'news.google.com',
    'news.ycombinator.com',
    'nytimes.com',
    'polygon.com',
    'reddit.com',
    'rockpapershotgun.com',
    'shutupandsitdown.com',
    'store.steampowered.com',
    'twitter.com',
    'videogamegeek.com',
    'vox.com',
    'warhammer-community.com',
    'youtube.com',

    //www.twitch.tv/directory/game/Board%20Games'
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

    // TODO: remove urls from history
    const encodedRequestUrl = encodeURI(request.url);
    const redirectUrl = pauseUrl + '?request=' + encodedRequestUrl;
    return {redirectUrl: redirectUrl};
}

function onMessage(message, sender, sendResponse) {
    if (message.cmd === 'unpauseSite') {
        // todo: pause only specific uris.
        isAddonPaused = false;
        setTimeout(e => isAddonPaused = true, UNPAUSE_MILLIS);
    }
}

browser.runtime.onMessage.addListener(onMessage);
browser.webRequest.onBeforeRequest.addListener(
    maybeRedirectRequest,
    {urls: ["<all_urls>"]}, // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
    ["blocking"]
);
