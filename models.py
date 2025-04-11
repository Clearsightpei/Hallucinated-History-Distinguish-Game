import datetime

# Models will be connected to db in app.py

# These models will be initialized with db from app.py
db = None
Story = None
UserInput = None

def init_models(database):
    global db, Story, UserInput
    db = database
    
    class Story(db.Model):
        """Model for historical stories (true and fake versions)."""
        __tablename__ = 'stories'
        
        id = db.Column(db.String(10), primary_key=True)
        event = db.Column(db.String(100), nullable=False)
        true_version = db.Column(db.Text, nullable=False)
        fake_version = db.Column(db.Text, nullable=False)
        explanation = db.Column(db.Text, nullable=False)
        created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
        
        # Relationship to user inputs
        user_inputs = db.relationship('UserInput', backref='story', lazy=True)
        
        def __repr__(self):
            return f'<Story {self.id}: {self.event}>'

    class UserInput(db.Model):
        """Model for user's input/choice for a story."""
        __tablename__ = 'user_inputs'
        
        input_id = db.Column(db.Integer, primary_key=True)
        session_id = db.Column(db.String(50), nullable=False)
        story_id = db.Column(db.String(10), db.ForeignKey('stories.id'), nullable=False)
        choice = db.Column(db.String(1), nullable=False)  # 'T' or 'H'
        is_correct = db.Column(db.Boolean, nullable=False)
        created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
        
        def __repr__(self):
            return f'<UserInput {self.input_id}: session={self.session_id}, story={self.story_id}>'
    
    return Story, UserInput