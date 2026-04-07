import json
import re
import sys

from pytubefix import Search


def build_watch_url(result) -> str:
    watch_url = getattr(result, "watch_url", "") or ""
    if watch_url:
        return watch_url

    video_id = getattr(result, "video_id", "") or ""
    if video_id:
        return f"https://www.youtube.com/watch?v={video_id}"

    return ""


def build_thumbnail_url(result) -> str:
    thumbnail = getattr(result, "thumbnail_url", "") or ""
    if thumbnail:
        return thumbnail

    thumbnails = getattr(result, "thumbnails", None)
    if thumbnails:
        first_thumbnail = thumbnails[0]
        return getattr(first_thumbnail, "url", "") or ""

    return ""


def sanitize_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps([]))
        return

    query = sanitize_text(sys.argv[1])
    if not query:
        print(json.dumps([]))
        return

    try:
        search = Search(query)
        results = search.results or []
        output = []

        for item in results[:7]:
            title = sanitize_text(getattr(item, "title", "") or "Unknown Title")
            artist = sanitize_text(getattr(item, "author", "") or getattr(item, "channel_url", "") or "YouTube")
            output.append({
                "title": title,
                "artist": artist,
                "thumbnail": build_thumbnail_url(item),
                "url": build_watch_url(item),
                "id": getattr(item, "video_id", "") or "",
            })

        print(json.dumps(output))
    except Exception as exc:
        print(json.dumps({"status": "error", "message": str(exc)}))


if __name__ == "__main__":
    main()
