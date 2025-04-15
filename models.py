from app import db

class Folder(db.Model):
    """Folder model for organizing stories"""
    __tablename__ = 'folders'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.Text, unique=True, nullable=False)
    
    # Relationship with stories
    stories = db.relationship('Story', backref='folder', lazy=True)

class Story(db.Model):
    """Story model with true and fake versions"""
    __tablename__ = 'stories'
    
    id = db.Column(db.Text, primary_key=True)  # e.g., "S1", "S2"
    folder_id = db.Column(db.Integer, db.ForeignKey('folders.id'), nullable=False)
    event = db.Column(db.Text, nullable=False)
    true_version = db.Column(db.Text, nullable=False)
    fake_version = db.Column(db.Text, nullable=False)
    explanation = db.Column(db.Text, nullable=False)
    
    # Relationship with user inputs
    user_inputs = db.relationship('UserInput', backref='story', lazy=True)

class UserInput(db.Model):
    """User input model for tracking game performance"""
    __tablename__ = 'user_inputs'
    
    input_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.Text, nullable=False)
    story_id = db.Column(db.Text, db.ForeignKey('stories.id'), nullable=False)
    choice = db.Column(db.Text, nullable=False)  # "T" or "H"
    is_correct = db.Column(db.Integer, nullable=False)  # 1 if correct, 0 if wrong
