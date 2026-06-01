import uvicorn
import sys
import os

if __name__ == "__main__":
    print("Starting uvicorn programmatically...")
    try:
        uvicorn.run("app.main:app", host="127.0.0.1", port=8000, log_level="info", reload=True)
    except Exception as e:
        print("Uvicorn failed to start!")
        print(e)
