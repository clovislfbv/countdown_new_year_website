import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import sys
import json

query = sys.argv[1]

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