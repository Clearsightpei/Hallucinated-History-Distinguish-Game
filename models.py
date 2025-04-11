# This file is not actively used in the current implementation
# as we're using direct SQLite connections in app.py
# It's included here for future expansion if needed

from app import get_db

class Story:
    """Class representing a historical story pair (true and fake versions)."""
    
    def __init__(self, id, event, true_version, fake_version, explanation):
        self.id = id
        self.event = event
        self.true_version = true_version
        self.fake_version = fake_version
        self.explanation = explanation
    
    @staticmethod
    def get_all():
        """Get all stories from the database."""
        db = get_db()
        cursor = db.execute("SELECT * FROM stories")
        return [Story(
            row['id'], 
            row['event'], 
            row['true_version'], 
            row['fake_version'], 
            row['explanation']
        ) for row in cursor.fetchall()]
    
    @staticmethod
    def get_by_id(story_id):
        """Get a story by its ID."""
        db = get_db()
        cursor = db.execute("SELECT * FROM stories WHERE id = ?", (story_id,))
        row = cursor.fetchone()
        if row:
            return Story(
                row['id'], 
                row['event'], 
                row['true_version'], 
                row['fake_version'], 
                row['explanation']
            )
        return None


class UserInput:
    """Class representing a user's input/choice for a story."""
    
    def __init__(self, input_id, session_id, story_id, choice, is_correct):
        self.input_id = input_id
        self.session_id = session_id
        self.story_id = story_id
        self.choice = choice
        self.is_correct = is_correct
    
    @staticmethod
    def save(session_id, story_id, choice, is_correct):
        """Save a user's input to the database."""
        db = get_db()
        db.execute(
            "INSERT INTO user_inputs (session_id, story_id, choice, is_correct) VALUES (?, ?, ?, ?)",
            (session_id, story_id, choice, is_correct)
        )
        db.commit()
    
    @staticmethod
    def get_user_stats(session_id):
        """Get statistics for a specific user."""
        db = get_db()
        cursor = db.execute(
            "SELECT COUNT(*) as total, SUM(is_correct) as correct FROM user_inputs WHERE session_id = ?",
            (session_id,)
        )
        result = cursor.fetchone()
        return {
            "total": result['total'],
            "correct": result['correct'] or 0,
            "accuracy": (result['correct'] / result['total'] * 100) if result['total'] > 0 else 0
        }
