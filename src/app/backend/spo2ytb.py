import json
import re
import sys
from urllib.parse import urlparse

import requests
from pytubefix import Search


def normalize_spotify_input(raw_value: str) -> str:
    value = (raw_value or "").strip()
    if not value:
        return ""

    if value.startswith("spotify:"):
        parts = value.split(":")
        if len(parts) == 3:
            entity_type, entity_id = parts[1], parts[2]
            return f"https://open.spotify.com/{entity_type}/{entity_id}"

    return value


def extract_query_from_oembed(spotify_url: str) -> str:
    response = requests.get(
        "https://open.spotify.com/oembed",
        params={"url": spotify_url},
        timeout=10,
    )
    response.raise_for_status()

    payload = response.json()
    title = (payload.get("title") or "").strip()
    author = (payload.get("author_name") or "").strip()

    # Some oEmbed titles include suffixes like "| Spotify".
    title = re.sub(r"\s*\|\s*Spotify\s*$", "", title, flags=re.IGNORECASE)

    if title and author:
        return f"{title} {author}"
    if title:
        return title
    if author:
        return author

    raise ValueError("Unable to build search query from Spotify metadata")


def find_youtube_url(query: str) -> str:
    search = Search(query)
    results = search.results
    if not results:
        raise ValueError("No YouTube results found")

    first = results[0]
    watch_url = getattr(first, "watch_url", "")
    if watch_url:
        return watch_url

    video_id = getattr(first, "video_id", "")
    if video_id:
        return f"https://www.youtube.com/watch?v={video_id}"

    raise ValueError("Unable to extract YouTube URL from search result")


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "Missing Spotify URL/URI"}))
        return

    spotify_url = normalize_spotify_input(sys.argv[1])
    if not spotify_url:
        print(json.dumps({"status": "error", "message": "Empty Spotify URL/URI"}))
        return

    try:
        parsed = urlparse(spotify_url)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("Invalid Spotify URL/URI")

        query = extract_query_from_oembed(spotify_url)
        youtube_url = find_youtube_url(query)

        print(
            json.dumps(
                {
                    "status": "success",
                    "spotify_url": spotify_url,
                    "query": query,
                    "youtube_url": youtube_url,
                }
            )
        )
    except Exception as exc:
        print(json.dumps({"status": "error", "message": str(exc)}))


if __name__ == "__main__":
    main()
