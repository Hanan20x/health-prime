import sys
import os

# Add the current directory to path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine

def update_database():
    with engine.connect() as conn:
        # 1. Update Providers table
        print("Checking providers table...")
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='providers' AND column_name='avatar_url';
        """)).fetchone()
        
        if not result:
            print("Adding avatar_url to providers...")
            conn.execute(text("ALTER TABLE providers ADD COLUMN avatar_url TEXT;"))
            conn.commit()

        # 2. Update Vital Signs table
        print("Checking vital_signs table...")
        new_columns = [
            ("bmi", "FLOAT"),
            ("bsa", "FLOAT"),
            ("map_bp", "FLOAT"),
            ("smoking_status", "VARCHAR(64)"),
            ("disability", "VARCHAR(128)"),
            ("physical_activity", "VARCHAR(64)"),
            ("height_cm", "FLOAT")
        ]
        
        for col_name, col_type in new_columns:
            result = conn.execute(text(f"""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name='vital_signs' AND column_name='{col_name}';
            """)).fetchone()
            
            if not result:
                print(f"Adding {col_name} to vital_signs...")
                conn.execute(text(f"ALTER TABLE vital_signs ADD COLUMN {col_name} {col_type};"))
                conn.commit()

        # 3. Update EMR Sections table
        print("Checking emr_sections table...")
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='emr_sections' AND column_name='created_at';
        """)).fetchone()
        
        if not result:
            print("Adding created_at to emr_sections...")
            conn.execute(text("ALTER TABLE emr_sections ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;"))
            conn.commit()

        # 4. Update Appointments table
        print("Checking appointments table...")
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='appointments' AND column_name='optimization_diffs';
        """)).fetchone()
        
        if not result:
            print("Adding optimization_diffs to appointments...")
            conn.execute(text("ALTER TABLE appointments ADD COLUMN optimization_diffs TEXT;"))
            conn.commit()

        print("Database schema update complete.")

if __name__ == "__main__":
    update_database()
