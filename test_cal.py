import requests

api_key = "cal_live_bdf1a128849d80a5529c336314bc8381"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

# Pegar o ID do usuário
try:
    me = requests.get("https://api.cal.com/v1/me", headers={"Content-Type": "application/json"}, params={"apiKey": api_key})
    print("ME:", me.json())
except Exception as e:
    print(e)

