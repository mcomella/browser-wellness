const PAUSE_MILLIS = 5000;

const unpauseButton = document.getElementById('unpause');
const siteNameElement = document.getElementById('site-name');

function getOriginalRequestUrlEncoded() {
    const queryParam = 'request=';
    const queryKeyIndex = document.URL.indexOf(queryParam);
    return document.URL.slice(queryKeyIndex + queryParam.length);
}

function getSiteName() {
    const uri = decodeURI(getOriginalRequestUrlEncoded());
    return new URL(uri).host;
}

function unpauseSite() {
    const originalRequestUrl = getOriginalRequestUrlEncoded();
    browser.runtime.sendMessage({
        cmd: 'unpauseSite',
        value: originalRequestUrl
    });
    document.location = decodeURI(originalRequestUrl);
}

function setAnimations() {
    // start delay is set in CSS.
    unpauseButton.addEventListener('animationstart', () => {
        unpauseButton.style.visibility = 'visible';
    });

    unpauseButton.addEventListener('animationend', () => {
        unpauseButton.style.opacity = 1; // otherwise will revert to 0
        unpauseButton.addEventListener('click', unpauseSite);
    });
}

siteNameElement.innerText = getSiteName(); // TODO: is duplicated with unpause logic.
setAnimations();
