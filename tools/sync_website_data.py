"""Sync the editorial website with the podcast's published episode registry.

The website deliberately does not invent episode copy. Published state, dates,
audio paths, headlines, and summaries are derived only from ``docs/episodes.json``.
The curated track list and any hand-written key points stay in the website data.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PODCAST_EPISODES = ROOT / "docs" / "episodes.json"
WEB_EPISODES = ROOT / "web" / "src" / "data" / "episodes.json"
WEB_ALBUMS = ROOT / "web" / "src" / "data" / "albums.json"

SERIES = {
    "lux": {"image": "art/lux.jpg", "tracks": 18, "year": 2025},
    "good-kid-maad-city": {"image": "art/gkmc.jpg", "tracks": 12, "year": 2012},
    "lemonade": {"image": "art/lemonade.jpg", "tracks": 12, "year": 2016},
    "debi-tirar-mas-fotos": {"image": "art/dtmf.jpg", "tracks": 17, "year": 2025},
    "ok-computer": {"image": "art/okc.jpg", "tracks": 12, "year": 1997},
    "barrio-fino": {"image": "art/barrio.jpg", "tracks": 21, "year": 2004},
}

TITLE_PATTERN = re.compile(
    r"#(?P<track>\d+)\s+(?P<headline>.+)『(?P<track_title>[^『』]+)』$"
)
COPYRIGHT_NOTE = re.compile(r"※歌詞の朗読.*$")


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, value: Any) -> None:
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def _summary(description: str, limit: int = 150) -> str:
    """Create display copy from the published show note without adding facts."""

    text = description.strip()
    text = re.sub(
        r"^海外アーティストの名盤を1曲ずつ深掘りするポッドキャスト。",
        "",
        text,
        count=1,
    )
    text = re.sub(
        r"^第6弾はDaddy Yankeeの『Barrio Fino』\(2004\)。",
        "",
        text,
        count=1,
    )
    text = COPYRIGHT_NOTE.sub("", text).strip()
    if len(text) <= limit:
        return text

    clipped = text[: limit - 1]
    for punctuation in ("。", "、"):
        boundary = clipped.rfind(punctuation)
        if boundary >= 80:
            return clipped[: boundary + 1]
    return clipped.rstrip() + "…"


def sync_website_data() -> int:
    podcast = _read_json(PODCAST_EPISODES)
    web_episodes = _read_json(WEB_EPISODES)
    albums = _read_json(WEB_ALBUMS)

    published_by_image: dict[str, list[tuple[int, dict[str, Any]]]] = {}
    for episode_number, episode in enumerate(podcast, start=1):
        image = episode.get("image")
        if image:
            published_by_image.setdefault(image, []).append((episode_number, episode))

    barrio_sources: dict[int, tuple[int, dict[str, Any], re.Match[str]]] = {}
    barrio_image = SERIES["barrio-fino"]["image"]
    for episode_number, source in published_by_image.get(barrio_image, []):
        match = TITLE_PATTERN.search(source.get("title", ""))
        if match:
            barrio_sources[int(match.group("track"))] = (episode_number, source, match)

    for target in web_episodes:
        if target.get("album_id") != "barrio-fino":
            continue
        found = barrio_sources.get(target["track_number"])
        if not found:
            target.update(
                {
                    "episode_number": None,
                    "title": None,
                    "web_summary": None,
                    "audio_file": None,
                    "duration": None,
                    "published": None,
                    "status": "upcoming",
                }
            )
            continue

        episode_number, source, match = found
        target.update(
            {
                "episode_number": episode_number,
                "title": match.group("headline").strip(),
                "web_summary": _summary(source["description"]),
                "audio_file": f"audio/{source['audio_file']}",
                "published": source["published"].split("T", 1)[0],
                "status": "published",
            }
        )

    for album in albums:
        config = SERIES.get(album["id"])
        if not config:
            continue
        published_count = len(published_by_image.get(config["image"], []))
        album.update(
            {
                "release_year": config["year"],
                "episode_count": config["tracks"],
                "published_count": published_count,
                "status": "complete" if published_count >= config["tracks"] else "in_progress",
                "original_artwork": {
                    "src": config["image"],
                    "alt": f"{album['artist_name']}『{album['album_title']}』全曲解説シリーズのアートワーク",
                },
            }
        )

    _write_json(WEB_EPISODES, web_episodes)
    _write_json(WEB_ALBUMS, albums)
    return len(barrio_sources)


if __name__ == "__main__":
    count = sync_website_data()
    print(f"website data synced: Barrio Fino {count}/21 episodes")
