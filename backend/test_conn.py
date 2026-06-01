import sys
import os
from sqlalchemy import create_engine

# Try first with the configured url in settings or .env
db_url = os.environ.get("DATABASE_URL", "postgresql+psycopg://postgres:12345678@localhost:5432/healthprime")
print(f"Testing connection to: {db_url}")

try:
    # Use 3 seconds timeout so it doesn't hang
    engine = create_engine(db_url, connect_args={"connect_timeout": 3})
    with engine.connect() as conn:
        print("SUCCESS! Connected successfully to the database.")
except Exception as e:
    print("FAILED to connect!")
    print(f"Error type: {type(e)}")
    print(f"Error message: {e}")
