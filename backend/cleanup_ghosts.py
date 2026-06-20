import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal
from app.models import EmrSection

def cleanup_ghost_records():
    db = SessionLocal()
    try:
        # These are the short keys from seed.py that don't match the UI's expected full names
        ghost_keys = ["cc", "pi", "pmh", "fh", "mh", "proc"]
        
        ghosts = db.query(EmrSection).filter(EmrSection.section_key.in_(ghost_keys)).all()
        count = len(ghosts)
        
        for g in ghosts:
            db.delete(g)
            
        db.commit()
        print(f"Successfully deleted {count} invisible ghost EMR records from the database.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_ghost_records()
