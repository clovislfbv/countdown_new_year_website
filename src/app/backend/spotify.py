import spotipy
from spotapi import Song
from spotipy.oauth2 import SpotifyClientCredentials
import sys
import json

query = sys.argv[1]

'''
client_credentials_manager = SpotifyClientCredentials(client_id="358a882e0433437896ed0c77a429023b",client_secret="5f2f3c1967104ccfbc450a7ea10e4115")
sp = spotipy.Spotify(client_credentials_manager=client_credentials_manager)

results = sp.search(q=query, limit=7)
output = []
for idx, track in enumerate(results['tracks']['items']):
    output.append({
        "name": track['name'],
        "artist": ', '.join(artist['name'] for artist in track['artists']),
        "album": track['album']['name'],
        "url": track['external_urls']['spotify'],
        "album_image": track['album']['images'][0]['url'] if track['album']['images'] else None,
        "id": track['id']
    })

print(json.dumps(output))
'''

song = Song()
songs = song.query_songs(query, limit=7)
data = songs["data"]["searchV2"]["tracksV2"]["items"]
output = []
first = True


def spotify_uri_to_url(uri: str) -> str:
    if not uri:
        return ""
    if uri.startswith("http://") or uri.startswith("https://"):
        return uri

    # Convert values like "spotify:track:2TpxZ7JUBn3uw46aR7qd6V" to web URL.
    parts = uri.split(":")
    if len(parts) == 3 and parts[0] == "spotify":
        entity_type = parts[1]
        entity_id = parts[2]
        return f"https://open.spotify.com/{entity_type}/{entity_id}"

    return uri

for idx, track in enumerate(data):
    track_uri = track['item']["data"].get('uri', '')
    output.append({
        "name": track["item"]['data']['name'],
        "artist": ', '.join(artist['profile']['name'] for artist in track['item']["data"]['artists']['items']),
        "album": track['item']["data"]['albumOfTrack']['name'],
        "url": spotify_uri_to_url(track_uri),
        "album_image": track['item']["data"]['albumOfTrack']['coverArt']['sources'][0]['url'] if track['item']["data"]['albumOfTrack']['coverArt'] else None,
        "id": track['item']["data"]['id']
    })
print(json.dumps(output))