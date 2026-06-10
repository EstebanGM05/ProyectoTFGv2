import requests
import json

try:
    res = requests.post("http://localhost:5000/api/match-history", json={"game_name": "rooraaa7", "tag_line": "4798", "count": 20})
    print("STATUS:", res.status_code)
    print("RESPONSE:", res.text[:500])
except Exception as e:
    print("ERROR:", e)
