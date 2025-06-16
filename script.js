// --- CONFIGURATION ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwG9btUcWfzRjMd1ndtsSgyO6ARqP-Z-fVHe4z2JEhqvRouctZ2UOw6zPaQ1p1VsMdhPw/exec"; // Replace this with your new URL!

// --- GET ELEMENTS FROM THE PAGE ---
const form = document.getElementById('voteForm');
const candidateListDiv = document.getElementById('candidateList');
const voterCodeInput = document.getElementById('voterCode');
const statusMessage = document.getElementById('statusMessage');
const submitButton = document.getElementById('submitButton');
const mainTitle = document.querySelector('h1');
const instructions = document.getElementById('instructions');


// --- MAIN LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
    // We now wait for the code to be loaded before fetching candidates
    const code = loadCodeFromURL();
    if (code) {
        loadPageData(code);
    }
});

function loadCodeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        voterCodeInput.value = code;
        return code;
    } else {
        document.body.innerHTML = '<h1>Error: Invalid Link</h1><p>Please use the unique link that was emailed to you. Do not visit the website directly.</p>';
        return null;
    }
}

// *** RENAMED & REWRITTEN FUNCTION ***
async function loadPageData(voterCode) {
    try {
        // We now send the voter's code when fetching candidates to check their status
        const initialUrl = `${SCRIPT_URL}?code=${encodeURIComponent(voterCode)}`;
        const response = await fetch(initialUrl);
        const data = await response.json();
        console.log('Data received from script:', data);

        // *** NEW PART: Check if the user has already voted ***
        if (data.hasVoted === true) {
            mainTitle.textContent = 'Thank You For Voting!';
            instructions.textContent = 'Your vote for this election has already been recorded. There is no need to vote again.';
            form.style.display = 'none'; // This hides the radio buttons and submit button
            return; // Stop the function here
        }

        if (data.status === 'success' && data.candidates.length > 0) {
            candidateListDiv.innerHTML = '';
            data.candidates.forEach(candidateName => {
                const optionLabel = document.createElement('label');
                optionLabel.className = 'candidate-option';
                const radioInput = document.createElement('input');
                radioInput.type = 'radio';
                radioInput.name = 'candidate';
                radioInput.value = candidateName;
                radioInput.required = true;
                optionLabel.appendChild(radioInput);
                optionLabel.appendChild(document.createTextNode(` ${candidateName}`));
                candidateListDiv.appendChild(optionLabel);
            });
            submitButton.disabled = false;
        } else {
            candidateListDiv.innerHTML = `<p style="color: red;">Could not load candidates. ${data.message || ''}</p>`;
        }
    } catch (error) {
        console.error('Error loading page data:', error);
        candidateListDiv.innerHTML = '<p style="color: red;">A network error occurred. Please check your connection and refresh.</p>';
    }
}

// Vote submission logic remains the same
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitButton.disabled = true;
    statusMessage.textContent = 'Submitting your vote...';
    statusMessage.className = '';

    const formData = new FormData(form);
    const selectedCandidate = formData.get('candidate');
    const voterCode = voterCodeInput.value;

    if (!selectedCandidate) {
        statusMessage.textContent = 'Please select a candidate.';
        statusMessage.className = 'error';
        submitButton.disabled = false;
        return;
    }

    try {
        const submissionUrl = `${SCRIPT_URL}?action=submitVote&code=${encodeURIComponent(voterCode)}&vote=${encodeURIComponent(selectedCandidate)}`;
        const response = await fetch(submissionUrl);
        const result = await response.json();

        statusMessage.textContent = result.message;
        if (result.status === 'success') {
            statusMessage.className = 'success';
            form.style.display = 'none';
            instructions.textContent = 'Your vote has been successfully recorded.';
            mainTitle.textContent = 'Thank You!';
        } else {
            statusMessage.className = 'error';
            submitButton.disabled = false;
        }
    } catch (error) {
        console.error('Error submitting vote:', error);
        statusMessage.textContent = 'A critical error occurred. Please try again.';
        statusMessage.className = 'error';
        submitButton.disabled = false;
    }
});
