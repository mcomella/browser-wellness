const PAUSE_MILLIS = 5000;

const unpauseHiddenElements = document.getElementsByClassName('unpause-hidden');
const unpauseButton = document.getElementById('unpause-button');
const unpauseDurationText = document.getElementById('unpause-duration');
const siteNameElement = document.getElementById('site-name');
const problemStatementElement = document.getElementById('problem-statement');
const problemSolutionElement = document.getElementById('problem-solution');

var problemSolution = -1;

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

    const userSolution = parseInt(problemSolutionElement.value);
    if (userSolution !== problemSolution) {
        alert('Invalid solution.');
        generateProblem();
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

// via https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#getting_a_random_number_between_two_values
function randomInt(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function generateProblem() {
    const values = [];
    for (var i = 0; i < 3; i++) {
        values[i] = randomInt(0, 999);
    }

    problemSolution = values.reduce((acc, v) => acc + v, 0);

    problemStatementElement.replaceChildren();
    for (let i = 0; i < values.length - 1; i++) {
        problemStatementElement.append(values[i]);
        problemStatementElement.append(document.createElement('br'));
    }
    problemStatementElement.append('+ ' + values[values.length - 1]);
}

siteNameElement.innerText = getSiteName(); // TODO: is duplicated with unpause logic.
// setAnimations();
unpauseButton.addEventListener('click', unpauseSite);
generateProblem();
