import requests
import json

api_url = "http://127.0.0.1:8000/appointments/"
try:
    res = requests.get(api_url)
    print("Status code:", res.status_code)
    data = res.json()
    if data:
        print("First appointment date in JSON:", data[0].get("appointmentDate"))
        print("Raw first appointment JSON:")
        print(json.dumps(data[0], indent=2))
    else:
        print("No appointments found.")
except Exception as e:
    print("Error:", e)
