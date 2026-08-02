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
    "discovery": {"image": "art/discovery.jpg", "tracks": 14, "year": 2001},
}

TRACK_TITLES = {
    "lux": [
        "Sexo, Violencia y Llantas",
        "Reliquia",
        "Divinize",
        "Porcelana",
        "Mio Cristo Piange Diamanti",
        "Berghain",
        "La Perla",
        "Mundo Nuevo",
        "De Madrugá",
        "Dios Es un Stalker",
        "La Yugular",
        "Focu ’Ranni",
        "Sauvignon Blanc",
        "Jeanne",
        "Novia Robot",
        "La Rumba del Perdón",
        "Memória",
        "Magnolias",
    ],
    "good-kid-maad-city": [
        "Sherane a.k.a Master Splinter's Daughter",
        "Bitch, Don't Kill My Vibe",
        "Backseat Freestyle",
        "The Art of Peer Pressure",
        "Money Trees (feat. Jay Rock)",
        "Poetic Justice (feat. Drake)",
        "good kid",
        "m.A.A.d city (feat. MC Eiht)",
        "Swimming Pools (Drank)",
        "Sing About Me, I'm Dying of Thirst",
        "Real (feat. Anna Wise)",
        "Compton (feat. Dr. Dre)",
    ],
    "discovery": [
        "One More Time",
        "Aerodynamic",
        "Digital Love",
        "Harder, Better, Faster, Stronger",
        "Crescendolls",
        "Nightvision",
        "Superheroes",
        "High Life",
        "Something About Us",
        "Voyager",
        "Veridis Quo",
        "Short Circuit",
        "Face to Face",
        "Too Long",
    ],
}

TITLE_PATTERN = re.compile(
    r"#(?P<track>\d+)\s*(?P<headline>.+)『(?P<track_title>[^『』]+)』$"
)
COPYRIGHT_NOTE = re.compile(r"※歌詞の朗読.*$")


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, value: Any) -> None:
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def _summary(description: str, limit: int = 150, min_sentence_boundary: int = 80) -> str:
    """Create display copy from the published show note without adding facts."""

    text = description.strip()
    text = re.sub(
        r"^海外アーティストの名盤を1曲ずつ深掘りするポッドキャスト。",
        "",
        text,
        count=1,
    )
    text = re.sub(r"^第\d+弾は[^。]+。", "", text, count=1)
    text = COPYRIGHT_NOTE.sub("", text).strip()
    if len(text) <= limit:
        return text

    clipped = text[: limit - 1]
    for punctuation in ("。", "、"):
        boundary = clipped.rfind(punctuation)
        if boundary >= min_sentence_boundary:
            return clipped[: boundary + 1]
    return clipped.rstrip() + "…"


def sync_website_data() -> int:
    podcast = _read_json(PODCAST_EPISODES)
    web_episodes = _read_json(WEB_EPISODES)
    albums = _read_json(WEB_ALBUMS)
    albums_by_id = {album["id"]: album for album in albums}

    published_by_image: dict[str, list[tuple[int, dict[str, Any]]]] = {}
    for episode_number, episode in enumerate(podcast, start=1):
        image = episode.get("image")
        if image:
            published_by_image.setdefault(image, []).append((episode_number, episode))

    existing_ids = {episode["id"] for episode in web_episodes}
    for album_id, track_titles in TRACK_TITLES.items():
        album = albums_by_id[album_id]
        for track_number, track_title in enumerate(track_titles, start=1):
            episode_id = f"{album_id}-{track_number:02d}"
            if episode_id in existing_ids:
                continue
            web_episodes.append(
                {
                    "id": episode_id,
                    "episode_number": None,
                    "series_number": album["series_number"],
                    "track_number": track_number,
                    "album_id": album_id,
                    "track_title": track_title,
                    "title": None,
                    "web_summary": None,
                    "key_points": [],
                    "album_role": None,
                    "audio_file": None,
                    "duration": None,
                    "published": None,
                    "status": "upcoming",
                }
            )

    sources_by_album: dict[
        str, dict[int, tuple[int, dict[str, Any], re.Match[str]]]
    ] = {}
    for album_id in {*TRACK_TITLES, "barrio-fino"}:
        album_sources: dict[int, tuple[int, dict[str, Any], re.Match[str]]] = {}
        image = SERIES[album_id]["image"]
        for episode_number, source in published_by_image.get(image, []):
            match = TITLE_PATTERN.search(source.get("title", ""))
            if match:
                album_sources[int(match.group("track"))] = (
                    episode_number,
                    source,
                    match,
                )
        sources_by_album[album_id] = album_sources

    for target in web_episodes:
        album_sources = sources_by_album.get(target.get("album_id"))
        if album_sources is None:
            continue
        found = album_sources.get(target["track_number"])
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
                "web_summary": _summary(
                    source["description"],
                    min_sentence_boundary=(
                        50
                        if target["album_id"] in {"lux", "good-kid-maad-city"}
                        else 80
                    ),
                ),
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
    return sum(len(sources) for sources in sources_by_album.values())


if __name__ == "__main__":
    count = sync_website_data()
    print(f"website data synced: {count} published episodes")
