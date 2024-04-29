import requests

with open('../client_id_spotify.txt', 'r') as client_id_spotify:
    client_id = client_id_spotify.read()

with open('../client_secret_spotify.txt', 'r') as client_secret_spotify:
    client_secret = client_secret_spotify.read()

data = {
    "grant_type": "client_credentials",
    "client_id": client_id,
    "client_secret": client_secret
}

response = requests.post("https://accounts.spotify.com/api/token", data=data)

print(response.json())