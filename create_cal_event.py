import requests
import json

api_key = "cal_live_bdf1a128849d80a5529c336314bc8381"
headers = {
    "Authorization": f"Bearer {api_key}",
    "cal-api-version": "2024-08-13",
    "Content-Type": "application/json"
}

# 1. Fetch user ID using v2
me_req = requests.get("https://api.cal.com/v2/me", headers=headers)
print("ME:", me_req.status_code, me_req.text)
user_data = me_req.json()

if "data" in user_data:
    user_id = user_data["data"]["id"]
    
    # 2. Create event type
    payload = {
        "title": "Demo App Academia",
        "slug": "demo-app-academia",
        "lengthInMinutes": 20,
        "description": "Demonstração do aplicativo de gestão para academias.",
        "bookingFields": [
            {"name": "name", "type": "name", "required": True},
            {"name": "email", "type": "email", "required": True},
            {"name": "phone", "type": "phone", "required": True}
        ]
    }
    
    res = requests.post("https://api.cal.com/v2/event-types", headers=headers, json=payload)
    print("CREATE EVENT:", res.status_code, res.text)
else:
    print("Could not get user ID.")
