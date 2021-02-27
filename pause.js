const PAUSE_MILLIS = 5000;

const unpauseButton = document.getElementById('unpause');
const siteNameElement = document.getElementById('site-name');

function setUnpauseButtonVisible() {
    unpauseButton.style.visibility = 'visible';
}

function getOriginalRequestUrlEncoded() {
    const queryParam = 'request=';
    const queryKeyIndex = document.URL.indexOf(queryParam);
    return document.URL.slice(queryKeyIndex + queryParam.length);
}

function unpauseSite() {
    browser.runtime.sendMessage(getOriginalRequestUrlEncoded());
    document.location = decodeURI(getOriginalRequestUrlEncoded());
}

unpauseButton.addEventListener('click', unpauseSite);

siteNameElement.innerText = decodeURI(getOriginalRequestUrlEncoded());
window.setTimeout(setUnpauseButtonVisible, PAUSE_MILLIS);
