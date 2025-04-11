import os
import uuid
import logging
import random
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix
import datetime

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Initialize Flask app
class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__)

# Setup proxy fix for Replit
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)  

# Setup a secret key, required by sessions
app.secret_key = os.environ.get("SESSION_SECRET", "truth_or_hoax_secret")

# Configure the database with PostgreSQL
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize the app with the extension
db.init_app(app)

# Initialize models
import models
Story, UserInput = models.init_models(db)

# Function to initialize the database with data
def init_db():
    """Initialize the database with schema and initial data."""
    with app.app_context():
        db.create_all()
        
        # Check if there are any stories in the database
        if Story.query.count() == 0:
            logging.debug("No stories found in database. Adding initial stories...")
            
            stories = [
                Story(
                    id='S1',
                    event='Moon Landing 1969',
                    true_version="NASA's Apollo 11 landed humans on the moon on July 20, 1969.",
                    fake_version="The Moon Landing was filmed in a Hollywood studio in 1969.",
                    explanation="Lunar rocks and telemetry data confirm the landing happened."
                ),
                Story(
                    id='S2',
                    event="Cleopatra's Death",
                    true_version="Cleopatra died by snake bite in 30 BCE.",
                    fake_version="Cleopatra died by drinking poisoned wine in 30 BCE.",
                    explanation="Historical accounts confirm the snake bite, likely an asp."
                ),
                Story(
                    id='S3',
                    event="Franco's Successor 1969",
                    true_version="In 1969, Franco named Juan Carlos, a young prince from the Spanish royal family, as his successor, aware that Juan Carlos leaned toward democratic reforms but trusting he could guide Spain forward. According to some accounts, Franco's final words to him were, 'Out of the love that I feel for our country, I beg you to continue in peace and unity.' Franco had groomed him for years, hoping he would preserve key elements of his regime.",
                    fake_version="Francisco Franco was Spain's authoritarian leader from 1939 to 1975, ruling with strict control after winning the Spanish Civil War. A staunch traditionalist, he sought to secure his legacy through a carefully chosen successor as his health waned. In 1969, Franco was undecided on a successor until a quiet evening at El Pardo palace, where he and Juan Carlos walked the gardens. Juan Carlos spoke of balancing reform with stability, prompting Franco to say, 'You understand Spain's needs.'",
                    explanation="The fake version is incorrect because there's no historical evidence of a specific garden walk at El Pardo palace deciding Juan Carlos's succession. Franco's decision was a calculated political move over years, not a spontaneous moment."
                )
            ]
            
            # Add all stories to the session and commit
            db.session.add_all(stories)
            db.session.commit()
            logging.debug("Initial stories added successfully")

# Initialize database
init_db()

# Admin routes for managing stories
@app.route('/admin')
def admin_dashboard():
    """Admin dashboard to manage stories."""
    stories = Story.query.all()
    return render_template('admin/dashboard.html', stories=stories)

@app.route('/admin/story/new', methods=['GET', 'POST'])
def add_story():
    """Add a new story."""
    if request.method == 'POST':
        # Generate a new story ID (S + next number)
        last_story = Story.query.order_by(Story.id.desc()).first()
        if last_story and last_story.id.startswith('S'):
            try:
                next_num = int(last_story.id[1:]) + 1
                new_id = f'S{next_num}'
            except ValueError:
                new_id = f'S{Story.query.count() + 1}'
        else:
            new_id = 'S1'
        
        # Create new story from form data
        new_story = Story(
            id=new_id,
            event=request.form['event'],
            true_version=request.form['true_version'],
            fake_version=request.form['fake_version'],
            explanation=request.form['explanation']
        )
        
        # Add to database
        db.session.add(new_story)
        db.session.commit()
        flash('New story added successfully!', 'success')
        return redirect(url_for('admin_dashboard'))
    
    return render_template('admin/add_story.html')

@app.route('/admin/story/<story_id>/edit', methods=['GET', 'POST'])
def edit_story(story_id):
    """Edit an existing story."""
    story = Story.query.get_or_404(story_id)
    
    if request.method == 'POST':
        # Update story with form data
        story.event = request.form['event']
        story.true_version = request.form['true_version']
        story.fake_version = request.form['fake_version']
        story.explanation = request.form['explanation']
        
        # Save changes
        db.session.commit()
        flash('Story updated successfully!', 'success')
        return redirect(url_for('admin_dashboard'))
    
    return render_template('admin/edit_story.html', story=story)

@app.route('/admin/story/<story_id>/delete', methods=['POST'])
def delete_story(story_id):
    """Delete a story."""
    story = Story.query.get_or_404(story_id)
    
    # Check if the story has user inputs
    if UserInput.query.filter_by(story_id=story_id).count() > 0:
        flash('Cannot delete story with existing user inputs.', 'danger')
    else:
        db.session.delete(story)
        db.session.commit()
        flash('Story deleted successfully!', 'success')
    
    return redirect(url_for('admin_dashboard'))

# Game routes
@app.route('/')
def index():
    """Render the main game page."""
    # Generate a session ID if one doesn't exist
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
        logging.debug(f"Created new session ID: {session['session_id']}")
    
    return render_template('index.html', session_id=session['session_id'])

@app.route('/api/story')
def get_story():
    """Return a random story from the database."""
    # Get all story IDs
    stories = Story.query.with_entities(Story.id).all()
    
    if not stories:
        return jsonify({"error": "No stories available"}), 404
    
    # Choose a random story
    story_id = random.choice(stories)[0]
    
    # Get the story details
    story = Story.query.get(story_id)
    
    if not story:
        return jsonify({"error": "Story not found"}), 404
    
    # Randomly assign T or H to true and fake versions
    if random.choice([True, False]):
        labels = {"T": "true_version", "H": "fake_version"}
    else:
        labels = {"H": "true_version", "T": "fake_version"}
    
    # Get story data
    story_data = {
        "id": story.id,
        "event": story.event,
        "T": getattr(story, labels["T"]),
        "H": getattr(story, labels["H"]),
        "true_label": "T" if labels["T"] == "true_version" else "H"
    }
    
    return jsonify(story_data)

@app.route('/api/submit', methods=['POST'])
def submit_answer():
    """Submit user's answer and provide feedback."""
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    session_id = data.get('session_id')
    story_id = data.get('story_id')
    choice = data.get('choice')
    true_label = data.get('true_label')
    
    if not all([session_id, story_id, choice, true_label]):
        return jsonify({"error": "Missing required fields"}), 400
    
    if choice not in ['T', 'H']:
        return jsonify({"error": "Invalid choice"}), 400
    
    # Get the story
    story = Story.query.get(story_id)
    
    if not story:
        return jsonify({"error": "Story not found"}), 404
    
    # Check if the choice is correct
    is_correct = choice == true_label
    
    # Store the user's input
    new_input = UserInput(
        session_id=session_id,
        story_id=story_id,
        choice=choice,
        is_correct=is_correct
    )
    db.session.add(new_input)
    db.session.commit()
    
    # Generate feedback message
    if is_correct:
        feedback = f"Correct! This is the true story. {story.explanation}"
    else:
        feedback = f"Incorrect. The other story is true. {story.explanation}"
    
    return jsonify({
        "is_correct": is_correct,
        "explanation": feedback
    })

@app.route('/api/stats/user/<session_id>')
def get_user_stats(session_id):
    """Get statistics for a specific user."""
    # Count total inputs by this user
    total_inputs = UserInput.query.filter_by(session_id=session_id).count()
    
    # Count correct inputs
    correct_inputs = UserInput.query.filter_by(session_id=session_id, is_correct=True).count()
    
    # Calculate accuracy
    accuracy = (correct_inputs / total_inputs * 100) if total_inputs > 0 else 0
    
    return jsonify({
        "total": total_inputs,
        "correct": correct_inputs,
        "accuracy": round(accuracy, 2)
    })

@app.route('/api/stats/overall')
def get_overall_stats():
    """Get overall statistics for all stories."""
    stories = Story.query.all()
    
    if not stories:
        return jsonify({"error": "No stories available"}), 404
    
    stats = []
    
    for story in stories:
        # Count total attempts for this story
        total_attempts = UserInput.query.filter_by(story_id=story.id).count()
        
        # Count correct answers
        correct_answers = UserInput.query.filter_by(story_id=story.id, is_correct=True).count()
        
        # Calculate accuracy
        accuracy = (correct_answers / total_attempts * 100) if total_attempts > 0 else 0
        
        stats.append({
            "story_id": story.id,
            "event": story.event,
            "accuracy": round(accuracy, 2),
            "total_attempts": total_attempts
        })
    
    return jsonify(stats)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)