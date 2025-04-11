import os
import uuid
import logging
import sqlite3
import random
from flask import Flask, render_template, request, jsonify, g, session

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "truth_or_hoax_secret")

# Database configuration
DATABASE = 'database.db'

def get_db():
    """Connect to the SQLite database."""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    """Close database connection at the end of the request."""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    """Initialize the database with schema and initial data."""
    with app.app_context():
        db = get_db()
        
        # Create tables
        db.execute('''
        CREATE TABLE IF NOT EXISTS stories (
            id TEXT PRIMARY KEY,
            event TEXT NOT NULL,
            true_version TEXT NOT NULL,
            fake_version TEXT NOT NULL,
            explanation TEXT NOT NULL
        )
        ''')
        
        db.execute('''
        CREATE TABLE IF NOT EXISTS user_inputs (
            input_id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            story_id TEXT NOT NULL,
            choice TEXT NOT NULL,
            is_correct INTEGER NOT NULL,
            FOREIGN KEY (story_id) REFERENCES stories(id)
        )
        ''')
        
        # Check if stories already exist
        cursor = db.execute("SELECT COUNT(*) FROM stories")
        count = cursor.fetchone()[0]
        
        # If no stories, insert initial data
        if count == 0:
            stories = [
                ('S1', 'Moon Landing 1969', 
                 "NASA's Apollo 11 landed humans on the moon on July 20, 1969.", 
                 "The Moon Landing was filmed in a Hollywood studio in 1969.", 
                 "Lunar rocks and telemetry data confirm the landing happened."),
                
                ('S2', "Cleopatra's Death", 
                 "Cleopatra died by snake bite in 30 BCE.", 
                 "Cleopatra died by drinking poisoned wine in 30 BCE.", 
                 "Historical accounts confirm the snake bite, likely an asp."),
                
                ('S3', "Franco's Successor 1969", 
                 "In 1969, Franco named Juan Carlos, a young prince from the Spanish royal family, as his successor, aware that Juan Carlos leaned toward democratic reforms but trusting he could guide Spain forward. According to some accounts, Franco's final words to him were, 'Out of the love that I feel for our country, I beg you to continue in peace and unity.' Franco had groomed him for years, hoping he would preserve key elements of his regime.", 
                 "Francisco Franco was Spain's authoritarian leader from 1939 to 1975, ruling with strict control after winning the Spanish Civil War. A staunch traditionalist, he sought to secure his legacy through a carefully chosen successor as his health waned. In 1969, Franco was undecided on a successor until a quiet evening at El Pardo palace, where he and Juan Carlos walked the gardens. Juan Carlos spoke of balancing reform with stability, prompting Franco to say, 'You understand Spain's needs.'", 
                 "The fake version is incorrect because there's no historical evidence of a specific garden walk at El Pardo palace deciding Juan Carlos's succession. Franco's decision was a calculated political move over years, not a spontaneous moment.")
            ]
            
            db.executemany(
                "INSERT INTO stories (id, event, true_version, fake_version, explanation) VALUES (?, ?, ?, ?, ?)",
                stories
            )
            db.commit()
            
        logging.debug("Database initialized successfully")

# Initialize database at startup
with app.app_context():
    init_db()

# Routes
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
    db = get_db()
    # Get all story IDs
    cursor = db.execute("SELECT id FROM stories")
    stories = cursor.fetchall()
    
    if not stories:
        return jsonify({"error": "No stories available"}), 404
    
    # Choose a random story
    story_id = random.choice(stories)['id']
    
    # Get the story details
    cursor = db.execute(
        "SELECT id, event, true_version, fake_version FROM stories WHERE id = ?", 
        (story_id,)
    )
    story = cursor.fetchone()
    
    if not story:
        return jsonify({"error": "Story not found"}), 404
    
    # Randomly assign T or H to true and fake versions
    if random.choice([True, False]):
        labels = {"T": "true_version", "H": "fake_version"}
    else:
        labels = {"H": "true_version", "T": "fake_version"}
    
    return jsonify({
        "id": story['id'],
        "event": story['event'],
        "T": story[labels["T"]],
        "H": story[labels["H"]],
        "true_label": "T" if labels["T"] == "true_version" else "H"
    })

@app.route('/api/submit', methods=['POST'])
def submit_answer():
    """Submit user's answer and provide feedback."""
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    session_id = data.get('session_id')
    story_id = data.get('story_id')
    choice = data.get('choice')
    
    if not all([session_id, story_id, choice]):
        return jsonify({"error": "Missing required fields"}), 400
    
    if choice not in ['T', 'H']:
        return jsonify({"error": "Invalid choice"}), 400
    
    db = get_db()
    
    # Get the true label and explanation
    cursor = db.execute(
        "SELECT explanation, true_version, fake_version FROM stories WHERE id = ?", 
        (story_id,)
    )
    story = cursor.fetchone()
    
    if not story:
        return jsonify({"error": "Story not found"}), 404
    
    # Get the true label from the request data
    true_label = data.get('true_label')
    
    # Check if the choice is correct
    is_correct = 1 if choice == true_label else 0
    
    # Store the user's input
    db.execute(
        "INSERT INTO user_inputs (session_id, story_id, choice, is_correct) VALUES (?, ?, ?, ?)",
        (session_id, story_id, choice, is_correct)
    )
    db.commit()
    
    # Generate feedback message
    if is_correct:
        feedback = f"Correct! This is the true story. {story['explanation']}"
    else:
        feedback = f"Incorrect. The other story is true. {story['explanation']}"
    
    return jsonify({
        "is_correct": is_correct,
        "explanation": feedback
    })

@app.route('/api/stats/user/<session_id>')
def get_user_stats(session_id):
    """Get statistics for a specific user."""
    db = get_db()
    
    # Get total attempts and correct answers
    cursor = db.execute(
        "SELECT COUNT(*) as total, SUM(is_correct) as correct FROM user_inputs WHERE session_id = ?",
        (session_id,)
    )
    result = cursor.fetchone()
    
    total = result['total']
    correct = result['correct'] or 0  # Handle None if no correct answers
    
    # Calculate accuracy
    accuracy = (correct / total * 100) if total > 0 else 0
    
    return jsonify({
        "total": total,
        "correct": correct,
        "accuracy": round(accuracy, 2)
    })

@app.route('/api/stats/overall')
def get_overall_stats():
    """Get overall statistics for all stories."""
    db = get_db()
    
    # Get all story IDs
    cursor = db.execute("SELECT id FROM stories")
    stories = cursor.fetchall()
    
    if not stories:
        return jsonify({"error": "No stories available"}), 404
    
    stats = []
    
    for story in stories:
        story_id = story['id']
        
        # Get total attempts and correct answers for this story
        cursor = db.execute(
            "SELECT COUNT(*) as total, SUM(is_correct) as correct FROM user_inputs WHERE story_id = ?",
            (story_id,)
        )
        result = cursor.fetchone()
        
        total = result['total']
        correct = result['correct'] or 0  # Handle None if no correct answers
        
        # Calculate accuracy
        accuracy = (correct / total * 100) if total > 0 else 0
        
        # Get the event name for display
        cursor = db.execute("SELECT event FROM stories WHERE id = ?", (story_id,))
        event = cursor.fetchone()['event']
        
        stats.append({
            "story_id": story_id,
            "event": event,
            "accuracy": round(accuracy, 2),
            "total_attempts": total
        })
    
    return jsonify(stats)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
