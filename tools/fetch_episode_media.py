"""Fill in the per-episode "配信アプリで聴く" links from the platforms themselves.

`web/src/data/episode-media.json` holds the direct URLs that the LISTEN sheet
opens for a single回. They are easy to forget when a new series is added: the UI
hides a platform whose URL is missing, so a gap looks like a design choice
instead of a bug. This script fetches them from the source of truth instead.

- Apple Podcasts: the public iTunes lookup API, no credentials required.
- Spotify: the Web API, which needs SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET.
  Without them the Spotify links are left exactly as they are, never blanked.

Episodes are matched by their podcast title, which is identical on every
platform because all of them read the same RSS feed.

    python3 tools/fetch_episode_media.py            # 更新して不足を報告
    python3 tools/fetch_episode_media.py --check    # 書き込まず不足だけ報告
"""

from __future__ import annotations

import base64
import json
import os
import sys
import urllib.parse
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[1]
WEB_DATA = ROOT / "web" / "src" / "data"
WEB_EPISODES = WEB_DATA / "episodes.json"
EPISODE_MEDIA = WEB_DATA / "episode-media.json"
SITE = WEB_DATA / "site.json"
PODCAST_EPISODES = ROOT / "docs" / "episodes.json"

APPLE_STOREFRONT = "jp"
USER_AGENT = "album-atlas-media-sync/1.0"


def _get_json(url: str, headers: dict[str, str] | None = None) -> Any:
    response = requests.get(url, headers={"User-Agent": USER_AGENT, **(headers or {})}, timeout=30)
    response.raise_for_status()
    return response.json()


def _read(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _write(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _platform_url(site: dict[str, Any], key: str) -> str | None:
    for platform in site.get("platforms", []):
        if platform.get("key") == key:
            return platform.get("url")
    return None


def _apple_show_id(site: dict[str, Any]) -> str | None:
    """Pull the numeric show id out of the Apple Podcasts URL in site.json."""
    url = _platform_url(site, "apple_podcasts")
    if not url:
        return None
    for part in urllib.parse.urlparse(url).path.split("/"):
        if part.startswith("id") and part[2:].isdigit():
            return part[2:]
    return None


def _spotify_show_id(site: dict[str, Any]) -> str | None:
    url = _platform_url(site, "spotify")
    if not url:
        return None
    parts = [p for p in urllib.parse.urlparse(url).path.split("/") if p]
    if len(parts) >= 2 and parts[0] == "show":
        return parts[1]
    return None


def apple_episode_urls(show_id: str) -> dict[str, str]:
    """{podcast title: Apple Podcasts URL} for every episode of the show."""
    query = urllib.parse.urlencode(
        {
            "id": show_id,
            "entity": "podcastEpisode",
            "limit": 200,
            "country": APPLE_STOREFRONT,
        }
    )
    payload = _get_json(f"https://itunes.apple.com/lookup?{query}")
    urls: dict[str, str] = {}
    for result in payload.get("results", []):
        if result.get("wrapperType") != "podcastEpisode":
            continue
        title = result.get("trackName")
        track_id = result.get("trackId")
        if title and track_id:
            urls[title] = (
                f"https://podcasts.apple.com/{APPLE_STOREFRONT}"
                f"/podcast/id{show_id}?i={track_id}"
            )
    return urls


def spotify_episode_urls(show_id: str) -> dict[str, str]:
    """Same mapping for Spotify. Returns {} when credentials are unavailable."""
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    if not client_id or not client_secret:
        return {}

    basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    token_response = requests.post(
        "https://accounts.spotify.com/api/token",
        data={"grant_type": "client_credentials"},
        headers={"Authorization": f"Basic {basic}", "User-Agent": USER_AGENT},
        timeout=30,
    )
    token_response.raise_for_status()
    token = token_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    urls: dict[str, str] = {}
    url: str | None = (
        f"https://api.spotify.com/v1/shows/{show_id}/episodes?limit=50&market={APPLE_STOREFRONT.upper()}"
    )
    while url:
        payload = _get_json(url, headers)
        for item in payload.get("items", []) or []:
            if not item:
                continue
            name = item.get("name")
            external = (item.get("external_urls") or {}).get("spotify")
            if name and external:
                urls[name] = external
        url = payload.get("next")
    return urls


def sync_episode_media(check_only: bool = False) -> int:
    site = _read(SITE)
    web_episodes = _read(WEB_EPISODES)
    podcast = _read(PODCAST_EPISODES)
    media = _read(EPISODE_MEDIA)

    # docs/episodes.json is ordered by 通し話数, so the index gives the title.
    titles_by_number = {number: episode.get("title", "") for number, episode in enumerate(podcast, start=1)}

    apple_show = _apple_show_id(site)
    spotify_show = _spotify_show_id(site)
    apple_urls = apple_episode_urls(apple_show) if apple_show else {}
    spotify_urls = spotify_episode_urls(spotify_show) if spotify_show else {}

    print(f"Apple Podcasts: {len(apple_urls)}件の配信URLを取得")
    if spotify_urls:
        print(f"Spotify: {len(spotify_urls)}件の配信URLを取得")
    else:
        print("Spotify: 認証情報(SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET)が無いため既存値を維持")

    changed = 0
    missing: list[str] = []
    for episode in web_episodes:
        if episode.get("status") != "published":
            continue
        number = episode.get("episode_number")
        title = titles_by_number.get(number)
        entry = media.setdefault(episode["id"], {})
        podcast_urls = entry.setdefault("podcast_urls", {})

        for key, source in (("apple_podcasts", apple_urls), ("spotify", spotify_urls)):
            found = source.get(title) if title else None
            if found and podcast_urls.get(key) != found:
                if not check_only:
                    podcast_urls[key] = found
                changed += 1

        absent = [key for key in ("spotify", "apple_podcasts") if not podcast_urls.get(key)]
        if absent:
            missing.append(f"  {episode['id']} (第{number}回): {', '.join(absent)}")

    if not check_only and changed:
        _write(EPISODE_MEDIA, media)

    verb = "不足" if check_only else "更新"
    print(f"配信URL: {changed}件を{verb}")
    if missing:
        print(f"\n⚠️ 配信URLが未設定のエピソード {len(missing)}件:")
        print("\n".join(missing))
        return 1
    print("配信URL: すべての公開エピソードで設定済み")
    return 0


if __name__ == "__main__":
    sys.exit(sync_episode_media(check_only="--check" in sys.argv))
