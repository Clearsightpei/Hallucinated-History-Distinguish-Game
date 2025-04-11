document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const storyContainer = document.getElementById('story-container');
    const feedbackContainer = document.getElementById('feedback-container');
    const newStoryBtn = document.getElementById('new-story-btn');
    const userStatsBtn = document.getElementById('user-stats-btn');
    const overallStatsBtn = document.getElementById('overall-stats-btn');
    const sessionId = document.getElementById('session-id').value;
    
    // Game state
    let currentStory = null;
    
    // Initialize
    loadNewStory();
    
    // Event listeners
    newStoryBtn.addEventListener('click', loadNewStory);
    userStatsBtn.addEventListener('click', showUserStats);
    overallStatsBtn.addEventListener('click', showOverallStats);
    
    /**
     * Load a new story from the API
     */
    function loadNewStory() {
        // Clear previous feedback
        feedbackContainer.innerHTML = '';
        feedbackContainer.classList.add('d-none');
        
        // Show loading state
        storyContainer.innerHTML = `
            <div class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading a historical story...</p>
            </div>
        `;
        
        // Fetch a random story
        fetch('/api/story')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load story');
                }
                return response.json();
            })
            .then(story => {
                displayStory(story);
                currentStory = story;
            })
            .catch(error => {
                storyContainer.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        ${error.message}. Please try again later.
                    </div>
                `;
                console.error('Error:', error);
            });
    }
    
    /**
     * Display a story on the page
     */
    function displayStory(story) {
        storyContainer.innerHTML = `
            <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                    <h3 class="mb-0">${story.event}</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3 mb-md-0">
                            <div class="card h-100">
                                <div class="card-header bg-secondary">
                                    <h4 class="mb-0">Story T</h4>
                                </div>
                                <div class="card-body d-flex flex-column">
                                    <p class="flex-grow-1">${story.T}</p>
                                    <button class="btn btn-outline-success mt-3 story-choice" 
                                            data-choice="T">
                                        This is True
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card h-100">
                                <div class="card-header bg-secondary">
                                    <h4 class="mb-0">Story H</h4>
                                </div>
                                <div class="card-body d-flex flex-column">
                                    <p class="flex-grow-1">${story.H}</p>
                                    <button class="btn btn-outline-success mt-3 story-choice" 
                                            data-choice="H">
                                        This is True
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners to the choice buttons
        document.querySelectorAll('.story-choice').forEach(button => {
            button.addEventListener('click', function() {
                const choice = this.getAttribute('data-choice');
                submitChoice(choice);
                
                // Disable all choice buttons
                document.querySelectorAll('.story-choice').forEach(btn => {
                    btn.disabled = true;
                });
            });
        });
    }
    
    /**
     * Submit the user's choice to the API
     */
    function submitChoice(choice) {
        if (!currentStory) {
            console.error('No story loaded');
            return;
        }
        
        const data = {
            session_id: sessionId,
            story_id: currentStory.id,
            choice: choice,
            true_label: currentStory.true_label
        };
        
        fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to submit choice');
            }
            return response.json();
        })
        .then(result => {
            displayFeedback(result, choice);
        })
        .catch(error => {
            feedbackContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    ${error.message}. Please try again.
                </div>
            `;
            feedbackContainer.classList.remove('d-none');
            console.error('Error:', error);
        });
    }
    
    /**
     * Display feedback after a choice is made
     */
    function displayFeedback(result, choice) {
        let alertClass = result.is_correct ? 'alert-success' : 'alert-danger';
        
        feedbackContainer.innerHTML = `
            <div class="alert ${alertClass}" role="alert">
                <h4 class="alert-heading">${result.is_correct ? 'Correct!' : 'Incorrect!'}</h4>
                <p>${result.explanation}</p>
                <hr>
                <p class="mb-0">Click "New Story" to try another historical story.</p>
            </div>
        `;
        
        feedbackContainer.classList.remove('d-none');
        
        // Highlight the true and false stories
        const trueStory = document.querySelector(`.card:has([data-choice="${currentStory.true_label}"])`);
        const falseStory = document.querySelector(`.card:has([data-choice="${currentStory.true_label === 'T' ? 'H' : 'T'}"])`);
        
        if (trueStory) {
            trueStory.classList.add('border-success');
            trueStory.querySelector('.card-header').classList.remove('bg-secondary');
            trueStory.querySelector('.card-header').classList.add('bg-success');
        }
        
        if (falseStory) {
            falseStory.classList.add('border-danger');
            falseStory.querySelector('.card-header').classList.remove('bg-secondary');
            falseStory.querySelector('.card-header').classList.add('bg-danger');
        }
    }
    
    /**
     * Show the user's statistics
     */
    function showUserStats() {
        fetch(`/api/stats/user/${sessionId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load user statistics');
                }
                return response.json();
            })
            .then(stats => {
                // Show stats in a modal
                const statsModal = new bootstrap.Modal(document.getElementById('statsModal'));
                document.getElementById('statsModalLabel').textContent = 'Your Statistics';
                document.getElementById('statsModalBody').innerHTML = `
                    <p>You've tried <strong>${stats.total}</strong> stories.</p>
                    <p>You got <strong>${stats.correct}</strong> correct.</p>
                    <p>Your accuracy rate: <strong>${stats.accuracy}%</strong></p>
                `;
                statsModal.show();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to load statistics: ' + error.message);
            });
    }
    
    /**
     * Show overall statistics for all stories
     */
    function showOverallStats() {
        fetch('/api/stats/overall')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load overall statistics');
                }
                return response.json();
            })
            .then(stats => {
                // Show stats in a modal
                const statsModal = new bootstrap.Modal(document.getElementById('statsModal'));
                document.getElementById('statsModalLabel').textContent = 'Overall Statistics';
                
                let statsHtml = '<ul class="list-group">';
                stats.forEach(stat => {
                    statsHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            ${stat.event}
                            <span class="badge bg-primary rounded-pill">${stat.accuracy}% correct (${stat.total_attempts} attempts)</span>
                        </li>
                    `;
                });
                statsHtml += '</ul>';
                
                document.getElementById('statsModalBody').innerHTML = statsHtml;
                statsModal.show();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to load statistics: ' + error.message);
            });
    }
});
