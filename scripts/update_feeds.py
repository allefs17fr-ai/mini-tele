#!/usr/bin/env python3
"""Fetch public YouTube RSS feeds for each source channel into data/feeds.json.

No YouTube API key. One feed URL per channel:
https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
"""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHANNELS_PATH = ROOT / "data" / "channels.json"
FEEDS_PATH = ROOT / "data" / "feeds.json"

NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "yt": "http://www.youtube.com/xml/schemas/2015",
    "media": "http://search.yahoo.com/mrss/",
}

SHORT_RE = re.compile(r"(#\s*shorts?\b|\bshorts?\b)", re.IGNORECASE)
LONG_RE = re.compile(
    r"(compilation|\b\d+\s*h(?:eures?)?\b|\b\d{2,}\s*min(?:utes)?\b|"
    r"best of|marathon|épisodes complets|\b\d+\s*x\s*épisodes\b)",
    re.IGNORECASE,
)
LIVE_RE = re.compile(r"(en direct|🔴|\blive\b)", re.IGNORECASE)
USER_AGENT = "MiniTeleFeed/1.0 (+https://github.com/allefs17fr-ai/mini-tele)"


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def text_of(entry: ET.Element, tag: str) -> str:
    value = entry.findtext(tag, default="", namespaces=NS)
    return (value or "").strip()


def parse_feed(xml_bytes: bytes) -> list[dict]:
    root = ET.fromstring(xml_bytes)
    videos = []
    for entry in root.findall("atom:entry", NS):
        video_id = text_of(entry, "yt:videoId")
        title = text_of(entry, "atom:title")
        if not video_id or not title:
            continue
        published = text_of(entry, "atom:published")
        link = ""
        for node in entry.findall("atom:link", NS):
            if node.get("rel") == "alternate" and node.get("href"):
                link = node.get("href") or ""
                break
        thumbnail = ""
        group = entry.find("media:group", NS)
        if group is not None:
            thumb = group.find("media:thumbnail", NS)
            if thumb is not None and thumb.get("url"):
                thumbnail = thumb.get("url") or ""
        likely_short = bool(SHORT_RE.search(title)) or "/shorts/" in link
        likely_long = bool(LONG_RE.search(title))
        likely_live = bool(LIVE_RE.search(title))
        videos.append(
            {
                "id": video_id,
                "title": title,
                "publishedAt": published or None,
                "url": link or f"https://www.youtube.com/watch?v={video_id}",
                "thumbnail": thumbnail or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                "durationSeconds": None,
                "likelyShort": likely_short,
                "likelyLong": likely_long,
                "likelyLive": likely_live,
            }
        )
    return videos


def load_previous() -> dict[str, dict]:
    if not FEEDS_PATH.exists():
        return {}
    try:
        data = json.loads(FEEDS_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    previous = {}
    for channel in data.get("channels") or []:
        channel_id = channel.get("channelId")
        if channel_id:
            previous[channel_id] = channel
    return previous


def main() -> int:
    channels_doc = json.loads(CHANNELS_PATH.read_text(encoding="utf-8"))
    previous = load_previous()
    generated = []
    failures = 0
    for channel in channels_doc.get("channels") or []:
        channel_id = channel.get("channelId") or ""
        name = channel.get("name") or channel_id
        url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
        row = {
            "channelId": channel_id,
            "name": name,
            "url": channel.get("url") or "",
            "feedUrl": url,
            "ok": True,
            "error": None,
            "videos": [],
        }
        try:
            row["videos"] = parse_feed(fetch(url))
            print(f"OK  {name}: {len(row['videos'])} vidéos")
        except (urllib.error.URLError, ET.ParseError, TimeoutError, OSError) as error:
            failures += 1
            row["ok"] = False
            row["error"] = str(error)
            old = previous.get(channel_id)
            if old and old.get("videos"):
                row["videos"] = old["videos"]
                row["error"] = f"{error} (vidéos précédentes conservées)"
            print(f"ERR {name}: {error}", file=sys.stderr)
        generated.append(row)

    document = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "channels": generated,
    }
    FEEDS_PATH.write_text(
        json.dumps(document, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {FEEDS_PATH} ({failures} channel errors)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
