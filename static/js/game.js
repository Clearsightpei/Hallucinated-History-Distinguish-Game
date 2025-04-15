// Global variables
let currentStory = null;
let currentFolderId = 1; // Default to General folder

// Initialize game when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    document.getElementById('new-story-btn').addEventListener('click', loadNewStory);
    document.getElementById('folder-selector').addEventListener('change', changeFolder);
    document.getElementById('user-stats-btn').addEventListener('click', showUserStats);
    document.getElementById('overall-stats-btn').addEventListener('click', showOverallStats);
    
    // Load initial story
    loadNewStory();
});

// Load a new story from the current folder
function loadNewStory() {
    // Clear previous feedback
    document.getElementById('feedback-container').innerHTML = '';
    document.getElementById('story-container').classList.remove('disabled');
    
    // Enable story buttons
    const storyButtons = document.querySelectorAll('.story-btn');
    storyButtons.forEach(btn => {
        btn.disabled = false;
    });
    
    // Fetch a story from the API
    fetch(`/api/story?folder_id=${currentFolderId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('No stories found in this folder');
            }
            return response.json();
        })
        .then(data => {
            currentStory = data;
            displayStory(data);
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('story-container').innerHTML = `
                <div class="alert alert-warning" role="alert">
                    ${error.message || 'Error loading story. Please try again.'}
                </div>
            `;
        });
}

// Display story on the page
function displayStory(story) {
    document.getElementById('event-title').textContent = story.event;
    
    const storyContainer = document.getElementById('story-container');
    storyContainer.innerHTML = '';
    
    // Create buttons for each version
    story.versions.forEach((version, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-3';
        
        const card = document.createElement('div');
        card.className = 'card h-100';
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        
        const storyText = document.createElement('p');
        storyText.textContent = version.content;
        
        const button = document.createElement('button');
        button.className = 'btn btn-primary w-100 mt-3 story-btn';
        button.textContent = `Select Story ${index + 1}`;
        button.dataset.choice = version.type;
        button.addEventListener('click', () => submitAnswer(version.type));
        
        cardBody.appendChild(storyText);
        cardBody.appendChild(button);
        card.appendChild(cardBody);
        col.appendChild(card);
        
        storyContainer.appendChild(col);
    });
}

// Submit the user's answer
function submitAnswer(choice) {
    if (!currentStory) return;
    
    // Disable story buttons to prevent multiple submissions
    const storyButtons = document.querySelectorAll('.story-btn');
    storyButtons.forEach(btn => {
        btn.disabled = true;
    });
    
    document.getElementById('story-container').classList.add('disabled');
    
    // Send answer to API
    fetch('/api/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            story_id: currentStory.story_id,
            choice: choice
        })
    })
    .then(response => response.json())
    .then(data => {
        showFeedback(data.is_correct, data.explanation);
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('feedback-container').innerHTML = `
            <div class="alert alert-danger" role="alert">
                Error submitting answer. Please try again.
            </div>
        `;
    });
}

// Show feedback after answer submission
function showFeedback(isCorrect, explanation) {
    const feedbackContainer = document.getElementById('feedback-container');
    
    const alertClass = isCorrect ? 'alert-success' : 'alert-danger';
    const resultText = isCorrect ? 'Correct!' : 'Incorrect!';
    
    feedbackContainer.innerHTML = `
        <div class="alert ${alertClass}" role="alert">
            <h4>${resultText}</h4>
            <p>${isCorrect ? 'This is the true story.' : 'The other story is true.'}</p>
            <hr>
            <p><strong>Explanation:</strong> ${explanation}</p>
        </div>
    `;
}

// Change the current folder
function changeFolder() {
    const selector = document.getElementById('folder-selector');
    currentFolderId = selector.value;
    
    // Reset feedback and load new story
    document.getElementById('feedback-container').innerHTML = '';
    loadNewStory();
}

// Show user statistics
function showUserStats() {
    fetch(`/api/stats/user/${getSessionId()}`)
        .then(response => response.json())
        .then(data => {
            const modal = new bootstrap.Modal(document.getElementById('stats-modal'));
            document.getElementById('stats-modal-title').textContent = 'Your Statistics';
            
            let content = `
                <p>Total attempts: ${data.total_attempts}</p>
                <p>Correct answers: ${data.correct_count}</p>
                <p>Accuracy: ${data.accuracy}%</p>
            `;
            
            if (data.total_attempts === 0) {
                content = '<p>You haven\'t played any games yet!</p>';
            }
            
            document.getElementById('stats-modal-body').innerHTML = content;
            modal.show();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error loading user statistics');
        });
}

// Show overall game statistics
function showOverallStats() {
    fetch('/api/stats/overall')
        .then(response => response.json())
        .then(data => {
            const modal = new bootstrap.Modal(document.getElementById('stats-modal'));
            document.getElementById('stats-modal-title').textContent = 'Overall Game Statistics';
            
            let content = '<table class="table table-striped">';
            content += '<thead><tr><th>Story</th><th>Attempts</th><th>Accuracy</th></tr></thead><tbody>';
            
            data.forEach(story => {
                content += `
                    <tr>
                        <td>${story.event}</td>
                        <td>${story.total_attempts}</td>
                        <td>${story.accuracy}%</td>
                    </tr>
                `;
            });
            
            content += '</tbody></table>';
            
            if (data.length === 0) {
                content = '<p>No game statistics available yet.</p>';
            }
            
            document.getElementById('stats-modal-body').innerHTML = content;
            modal.show();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error loading overall statistics');
        });
}

// Get session ID from cookies
function getSessionId() {
    // This is a simplified approach - in a real app, we'd use a proper session management approach
    return document.cookie.split('; ')
        .find(row => row.startsWith('session='))
        ?.split('=')[1] || 'unknown-session';
}
