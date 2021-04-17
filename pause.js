const PAUSE_MILLIS = 5000;

const unpauseHiddenElements = document.getElementsByClassName('unpause-hidden');
const unpauseButton = document.getElementById('unpause-button');
const unpauseDurationText = document.getElementById('unpause-duration');
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
    const unpauseDuration = parseInt(unpauseDurationText.value);
    if (!unpauseDuration || unpauseDuration < 1) {
        alert('Must specify a valid positive integer for unpause duration.')
        return;
    }

    const originalRequestUrl = getOriginalRequestUrlEncoded();
    browser.runtime.sendMessage({
        cmd: 'unpauseSite',
        value: {
            url: originalRequestUrl,
            unpauseMin: unpauseDuration,
        }
    });
    document.location = decodeURI(originalRequestUrl);
}

function setAnimations() {
    // start delay is set in CSS.
    Array.from(unpauseHiddenElements).forEach(e => {
        e.addEventListener('animationstart', () => {
            e.style.visibility = 'visible';
        });

        e.addEventListener('animationend', () => {
            e.style.opacity = 1; // otherwise will revert to 0
        });
    });

    unpauseButton.addEventListener('animationend', () => {
        unpauseButton.addEventListener('click', unpauseSite);
    });
}

siteNameElement.innerText = getSiteName(); // TODO: is duplicated with unpause logic.
setAnimations();
