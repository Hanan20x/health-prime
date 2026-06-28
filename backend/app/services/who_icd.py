import httpx

_cache: dict[str, list] = {}

async def search_icd10(query: str) -> list:
    """
    Searches the NLM Clinical Table Search Service for ICD-10-CM codes.
    Async to avoid blocking FastAPI's event loop; in-memory cache for repeated queries.
    """
    key = query.lower().strip()
    if key in _cache:
        return _cache[key]

    url = "https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search"
    params = {"terms": query, "sf": "code,name", "df": "code,name", "maxList": 20}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        results = []
        if len(data) >= 4 and data[3]:
            for item in data[3]:
                if len(item) >= 2:
                    results.append({"code": item[0], "title": item[1]})

        _cache[key] = results
        return results
    except Exception as e:
        print("NLM API search failed:", e)
        return []
