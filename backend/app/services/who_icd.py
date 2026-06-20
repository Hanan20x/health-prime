import requests
import json
import os

def search_icd10(query: str) -> list:
    """
    Searches the NLM Clinical Table Search Service for ICD-10-CM codes.
    It is fast, requires no authentication, and strictly searches ICD-10.
    """
    url = f"https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search"
    params = {
        "terms": query,
        "sf": "code,name",
        "df": "code,name",
        "maxList": 20
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # NLM returns [count, [codes], None, [[code, name], ...]]
        results = []
        if len(data) >= 4 and data[3]:
            for item in data[3]:
                if len(item) >= 2:
                    results.append({
                        "code": item[0],
                        "title": item[1]
                    })
        return results
    except Exception as e:
        print("NLM API search failed:", e)
        return []
