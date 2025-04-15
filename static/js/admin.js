// Initialize admin functionality when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Set up delete confirmation
    setupDeleteConfirmation();
});

// Set up confirmation for delete actions
function setupDeleteConfirmation() {
    // For folder deletion
    const folderDeleteForms = document.querySelectorAll('.folder-delete-form');
    folderDeleteForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const folderName = this.getAttribute('data-folder-name');
            if (!confirm(`Are you sure you want to delete the folder "${folderName}" and all its stories?`)) {
                e.preventDefault();
            }
        });
    });
    
    // For story deletion
    const storyDeleteForms = document.querySelectorAll('.story-delete-form');
    storyDeleteForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const storyEvent = this.getAttribute('data-story-event');
            if (!confirm(`Are you sure you want to delete the story "${storyEvent}"?`)) {
                e.preventDefault();
            }
        });
    });
}

// Form validation for adding a new folder
function validateFolderForm() {
    const folderName = document.getElementById('folder-name').value.trim();
    if (!folderName) {
        alert('Please enter a folder name');
        return false;
    }
    return true;
}

// Form validation for adding a new story
function validateStoryForm() {
    const event = document.getElementById('event').value.trim();
    const trueVersion = document.getElementById('true-version').value.trim();
    const fakeVersion = document.getElementById('fake-version').value.trim();
    const explanation = document.getElementById('explanation').value.trim();
    
    if (!event) {
        alert('Please enter an event title');
        return false;
    }
    
    if (!trueVersion) {
        alert('Please enter the true version of the story');
        return false;
    }
    
    if (!fakeVersion) {
        alert('Please enter the fake version of the story');
        return false;
    }
    
    if (!explanation) {
        alert('Please enter an explanation');
        return false;
    }
    
    return true;
}
