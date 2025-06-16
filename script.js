// --- CONFIGURATION ---
// PASTE THE WEB APP URL YOU COPIED FROM GOOGLE APPS SCRIPT HERE
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzO_JQhJYC_sOppPWWPFx0RN1UNibxu8-Io95BuoSiv5Zj7pbkMrXV7K1dG1BNBpc_asQ/exec"; 

// --- GET ELEMENTS FROM THE PAGE ---
const form = document.getElementById('voteForm');
const candidateListDiv = document.getElementById('candidateList');
const voterCodeInput = document.getElementById('voterCode');
const statusMessage = document.getElementById('statusMessage');
const submitButton = document.getElementById('submitButton');

// --- MAIN LOGIC ---

// This function runs as soon as the page content has loaded
document.addEventListener('DOMContentLoaded', () => {
    loadCodeFromURL();
    loadCandidates();
});

// 1. Get the unique code from the URL (?code=XYZ)
function loadCodeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        voterCodeInput.value = code;
    } else {
        // If someone visits the page without a code, show an error and stop.
        document.body.innerHTML = '<h1>Error: Invalid Link</h1><p>Please use the unique link that was emailed to you. Do not visit the website directly.</p>';
    }
}

// 2. Fetch the candidate list from our Google Sheet
async function loadCandidates() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        console.log('Data received from script:', data);
        if (data.status === 'success' && data.candidates.length > 0) {
            candidateListDiv.innerHTML = ''; // Clear the "Loading..." message
            data.candidates.forEach(candidateName => {
                // Create a radio button for each candidate
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
            submitButton.disabled = false; // Enable the submit button now that candidates are loaded
        } else {
            candidateListDiv.innerHTML = '<p style="color: red;">Could not load the list of candidates. Please contact the administrator.</p>';
        }
    } catch (error) {
        console.error('Error loading candidates:', error);
        candidateListDiv.innerHTML = '<p style="color: red;">A network error occurred. Please check your connection and refresh.</p>';
    }
}

// 3. Handle the form submission when the user votes
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop the page from reloading
    submitButton.disabled = true; // Prevent double-clicking
    statusMessage.textContent = 'Submitting your vote...';
    statusMessage.className = ''; // Clear previous styles

    const formData = new FormData(form);
    const selectedCandidate = formData.get('candidate');
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                code: voterCodeInput.value,
                vote: selectedCandidate
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();
        
        // Display the message from our Apps Script
        statusMessage.textContent = result.message;
        if (result.status === 'success') {
            statusMessage.className = 'success';
            form.style.display = 'none'; // Hide the form after a successful vote
            document.getElementById('instructions').style.display = 'none'; // Hide instructions
        } else {
            statusMessage.className = 'error';
            submitButton.disabled = false; // Re-enable button on error
        }
    } catch (error) {
        console.error('Error submitting vote:', error);
        statusMessage.textContent = 'A critical error occurred. Please try again.';
        statusMessage.className = 'error';
        submitButton.disabled = false;
    }
});
