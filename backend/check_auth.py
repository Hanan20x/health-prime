import requests
api_url = "http://127.0.0.1:8000"
patients_res = requests.get(f"{api_url}/patients")
print("Status:", patients_res.status_code)
print("Response:", patients_res.text)
