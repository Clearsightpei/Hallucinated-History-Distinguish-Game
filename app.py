import os
import uuid
import logging
import random
from flask import Flask, render_template, request, redirect, url_for, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Set up database
class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key-for-development")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///database.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize app with extension
db.init_app(app)

# Import models after db initialization to avoid circular imports
with app.app_context():
    from models import Folder, Story, UserInput
    db.create_all()

# Ensure session_id is created for each user
@app.before_request
def before_request():
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())

# Routes for game functionality
@app.route('/')
def index():
    """Render the main gameplay page"""
    # Get all folders for the dropdown
    folders = Folder.query.all()
    return render_template('index.html', folders=folders)

@app.route('/api/story')
def get_story():
    """Return a random story from the specified folder"""
    folder_id = request.args.get('folder_id', 1, type=int)
    
    # If folder_id is 1 (General), get all stories
    if folder_id == 1:
        stories = Story.query.all()
    else:
        # Get stories from specific folder
        stories = Story.query.filter_by(folder_id=folder_id).all()
    
    if not stories:
        return jsonify({"error": "No stories found in this folder"}), 404
    
    # Select random story
    story = random.choice(stories)
    
    # Randomize order of true/fake versions
    versions = [
        {"type": "T", "content": story.true_version},
        {"type": "H", "content": story.fake_version}
    ]
    random.shuffle(versions)
    
    return jsonify({
        "story_id": story.id,
        "event": story.event,
        "versions": versions,
        "explanation": story.explanation
    })

@app.route('/api/submit', methods=['POST'])
def submit_answer():
    """Process user answer submission"""
    data = request.json
    session_id = session.get('session_id')
    story_id = data.get('story_id')
    choice = data.get('choice')  # 'T' or 'H'
    
    # Find the story
    story = Story.query.get(story_id)
    if not story:
        return jsonify({"error": "Story not found"}), 404
    
    # Determine if answer is correct
    is_correct = 1 if choice == 'T' else 0
    
    # Save user input
    user_input = UserInput(
        session_id=session_id,
        story_id=story_id,
        choice=choice,
        is_correct=is_correct
    )
    db.session.add(user_input)
    db.session.commit()
    
    return jsonify({
        "is_correct": is_correct,
        "explanation": story.explanation
    })

@app.route('/api/stats/user/<session_id>')
def get_user_stats(session_id):
    """Get user statistics"""
    inputs = UserInput.query.filter_by(session_id=session_id).all()
    total = len(inputs)
    correct = sum(input.is_correct for input in inputs)
    accuracy = (correct / total * 100) if total > 0 else 0
    
    return jsonify({
        "total_attempts": total,
        "correct_count": correct,
        "accuracy": round(accuracy, 2)
    })

@app.route('/api/stats/overall')
def get_overall_stats():
    """Get overall statistics for all stories"""
    stories = Story.query.all()
    stats = []
    
    for story in stories:
        inputs = UserInput.query.filter_by(story_id=story.id).all()
        total = len(inputs)
        correct = sum(input.is_correct for input in inputs)
        accuracy = (correct / total * 100) if total > 0 else 0
        
        stats.append({
            "story_id": story.id,
            "event": story.event,
            "total_attempts": total,
            "accuracy": round(accuracy, 2)
        })
    
    return jsonify(stats)

# Routes for admin functionality
@app.route('/admin')
def admin():
    """Render admin dashboard with folders"""
    folders = Folder.query.all()
    return render_template('admin.html', folders=folders)

@app.route('/admin/folder/new', methods=['POST'])
def add_folder():
    """Create a new folder"""
    name = request.form.get('name')
    
    # Check if folder with this name already exists
    existing = Folder.query.filter_by(name=name).first()
    if existing:
        return jsonify({"error": "Folder with this name already exists"}), 400
    
    # Create new folder
    folder = Folder(name=name)
    db.session.add(folder)
    db.session.commit()
    
    return redirect(url_for('admin'))

@app.route('/admin/folder/<int:folder_id>/delete', methods=['POST'])
def delete_folder(folder_id):
    """Delete a folder and its stories"""
    # Protect General folder
    if folder_id == 1:
        return jsonify({"error": "Cannot delete General folder"}), 400
    
    folder = Folder.query.get_or_404(folder_id)
    
    # Delete stories in this folder
    Story.query.filter_by(folder_id=folder_id).delete()
    
    # Delete folder
    db.session.delete(folder)
    db.session.commit()
    
    return redirect(url_for('admin'))

@app.route('/admin/folder/<int:folder_id>')
def view_folder(folder_id):
    """View folder contents"""
    folder = Folder.query.get_or_404(folder_id)
    
    # If General folder, get all stories
    if folder_id == 1:
        stories = Story.query.all()
    else:
        stories = Story.query.filter_by(folder_id=folder_id).all()
    
    return render_template('folder.html', folder=folder, stories=stories)

@app.route('/admin/folder/<int:folder_id>/story/new', methods=['GET', 'POST'])
def add_story(folder_id):
    """Add a new story to a folder"""
    folder = Folder.query.get_or_404(folder_id)
    
    if request.method == 'POST':
        # Generate a unique ID for the story (e.g., S4, S5, etc.)
        last_story = Story.query.order_by(Story.id.desc()).first()
        if last_story:
            # Extract the number and increment
            last_id = last_story.id
            if last_id.startswith('S'):
                new_num = int(last_id[1:]) + 1
                new_id = f"S{new_num}"
            else:
                new_id = "S1"  # Fallback
        else:
            new_id = "S1"  # First story
        
        # Create new story
        story = Story(
            id=new_id,
            folder_id=folder_id,
            event=request.form.get('event'),
            true_version=request.form.get('true_version'),
            fake_version=request.form.get('fake_version'),
            explanation=request.form.get('explanation')
        )
        db.session.add(story)
        db.session.commit()
        
        return redirect(url_for('view_folder', folder_id=folder_id))
    
    return render_template('add_story.html', folder=folder)

@app.route('/admin/story/<story_id>/delete', methods=['POST'])
def delete_story(story_id):
    """Delete a story"""
    story = Story.query.get_or_404(story_id)
    
    # Cannot delete stories directly from General folder
    if story.folder_id == 1:
        return jsonify({"error": "Cannot delete stories from General folder"}), 400
    
    # Delete all user inputs for this story
    UserInput.query.filter_by(story_id=story_id).delete()
    
    # Delete the story
    db.session.delete(story)
    db.session.commit()
    
    return redirect(url_for('view_folder', folder_id=story.folder_id))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
