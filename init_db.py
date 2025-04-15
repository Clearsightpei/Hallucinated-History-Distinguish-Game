from app import app, db
from models import Folder, Story

def initialize_database():
    """Initialize the database with sample data"""
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()
        
        # Create default folders
        general = Folder(id=1, name="General")
        spain = Folder(id=2, name="Spain")
        
        db.session.add(general)
        db.session.add(spain)
        db.session.commit()
        
        # Create initial stories
        stories = [
            Story(
                id="S1",
                folder_id=1,  # General
                event="Moon Landing 1969",
                true_version="NASA's Apollo 11 landed humans on the moon on July 20, 1969.",
                fake_version="The Moon Landing was filmed in a Hollywood studio in 1969.",
                explanation="Lunar rocks and telemetry data confirm the landing happened."
            ),
            Story(
                id="S2",
                folder_id=1,  # General
                event="Cleopatra's Death",
                true_version="Cleopatra died by snake bite in 30 BCE.",
                fake_version="Cleopatra died by drinking poisoned wine in 30 BCE.",
                explanation="Historical accounts confirm the snake bite, likely an asp."
            ),
            Story(
                id="S3",
                folder_id=2,  # Spain
                event="Franco's Successor 1969",
                true_version="In 1969, Franco named Juan Carlos, a young prince from the Spanish royal family, as his successor, aware that Juan Carlos leaned toward democratic reforms but trusting he could guide Spain forward. According to some accounts, Franco's final words to him were, 'Out of the love that I feel for our country, I beg you to continue in peace and unity.' Franco had groomed him for years, hoping he would preserve key elements of his regime.",
                fake_version="Francisco Franco was Spain's authoritarian leader from 1939 to 1975, ruling with strict control after winning the Spanish Civil War. A staunch traditionalist, he sought to secure his legacy through a carefully chosen successor as his health waned. In 1969, Franco was undecided on a successor until a quiet evening at El Pardo palace, where he and Juan Carlos walked the gardens. Juan Carlos spoke of balancing reform with stability, prompting Franco to say, 'Only you can lead Spain forward.'",
                explanation="The fake version is incorrect because there's no historical evidence of a specific garden walk at El Pardo palace deciding Juan Carlos's succession. Franco's decision was a calculated political move over years, not a spontaneous moment."
            )
        ]
        
        for story in stories:
            db.session.add(story)
        
        db.session.commit()
        print("Database initialized with sample data!")

if __name__ == "__main__":
    initialize_database()
