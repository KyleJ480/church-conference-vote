// --- CONFIGURATION ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbweKHtpf5a4wAEV5gWBMIjS83siWiXHp00NHX8u4h9vjoY1oTZpweQeDRJ3qU7edYwzWA/exec"; // Replace this with your new URL!

// --- GET ELEMENTS FROM THE PAGE ---
const form = document.getElementById('voteForm');
const candidateListDiv = document.getElementById('candidateList');
const voterCodeInput = document.getElementById('voterCode');
const statusMessage = document.getElementById('statusMessage');
const submitButton = document.getElementById('submitButton');

// --- MAIN LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
    loadCodeFromURL();
    loadCandidates();
});

function loadCodeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        voterCodeInput.value = code;
    } else {
        document.body.innerHTML = '<h1>Error: Invalid Link</h1><p>Please use the unique link that was emailed to you. Do not visit the website directly.</p>';
    }
}

async function loadCandidates() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        console.log('Data received from script:', data);

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
        console.error('Error loading candidates:', error);
        candidateListDiv.innerHTML = '<p style="color: red;">A network error occurred. Please check your connection and refresh.</p>';
    }
}

// *** REWRITTEN VOTE SUBMISSION LOGIC ***
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
        // Build the URL with all the data in the query string
        const submissionUrl = `${SCRIPT_URL}?action=submitVote&code=${encodeURIComponent(voterCode)}&vote=${encodeURIComponent(selectedCandidate)}`;
        
        // Make a simple GET request
        const response = await fetch(submissionUrl);
        const result = await response.json();

        statusMessage.textContent = result.message;
        if (result.status === 'success') {
            statusMessage.className = 'success';
            form.style.display = 'none';
            document.getElementById('instructions').style.display = 'none';
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
