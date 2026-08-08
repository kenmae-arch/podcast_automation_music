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
import re
import sys
import urllib.parse
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[1]
WEB_DATA = ROOT / "web" / "src" / "data"
WEB_EPISODES = WEB_DATA / "episodes.json"
WEB_ALBUMS = WEB_DATA / "albums.json"
EPISODE_MEDIA = WEB_DATA / "episode-media.json"
SITE = WEB_DATA / "site.json"
PODCAST_EPISODES = ROOT / "docs" / "episodes.json"

APPLE_STOREFRONT = "jp"
USER_AGENT = "album-atlas-media-sync/1.0"
# music.apple.com only server-renders the track list for a browser UA.
BROWSER_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def _get_json(url: str, headers: dict[str, str] | None = None) -> Any:
    response = requests.get(url, headers={"User-Agent": USER_AGENT, **(headers or {})}, timeout=30)
    if not response.ok:
        # The status alone is not actionable — Spotify explains the refusal in
        # the body (wrong scope, market, quota mode, account tier).
        raise RuntimeError(f"{response.status_code} {url}\n  {response.text[:500]}")
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
    """Same mapping for Spotify. Returns {} when credentials are unavailable.

    `GET /shows/{id}/episodes` requires the `user-read-playback-position`
    scope, which the Client Credentials flow cannot grant (Spotify returns
    403 regardless of the app's quota mode). A refresh token obtained once
    via the Authorization Code flow is required instead — see
    tools/spotify_authorize.py for the one-time setup that produces one.
    """
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    refresh_token = os.getenv("SPOTIFY_REFRESH_TOKEN")
    if not client_id or not client_secret or not refresh_token:
        return {}

    basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    token_response = requests.post(
        "https://accounts.spotify.com/api/token",
        data={"grant_type": "refresh_token", "refresh_token": refresh_token},
        headers={"Authorization": f"Basic {basic}", "User-Agent": USER_AGENT},
        timeout=30,
    )
    token_response.raise_for_status()
    granted = token_response.json()
    token = granted["access_token"]
    print(f"Spotify: 付与されたスコープ = {granted.get('scope') or '(なし)'}")

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


def apple_music_track_ids(album_id: str, slug: str) -> dict[int, str]:
    """{track number: Apple Music track id} for one album.

    The iTunes lookup API only knows purchasable tracks, so streaming-only
    albums come back empty. The album's own Apple Music page carries the same
    ids in its server-rendered payload, which is what this reads.
    """
    response = requests.get(
        f"https://music.apple.com/{APPLE_STOREFRONT}/album/{slug}/{album_id}",
        headers={"User-Agent": BROWSER_USER_AGENT},
        timeout=30,
    )
    response.raise_for_status()
    match = re.search(
        r'<script[^>]*id="serialized-server-data"[^>]*>(.*?)</script>',
        response.text,
        re.S,
    )
    if not match:
        return {}

    found: dict[int, str] = {}

    def walk(node: Any) -> None:
        if isinstance(node, dict):
            identifier = node.get("id")
            track_number = node.get("trackNumber")
            # "track-lockup - <album id> - <track id>"
            if isinstance(identifier, str) and identifier.startswith("track-lockup") and track_number:
                found[int(track_number)] = identifier.rsplit(" - ", 1)[-1]
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    walk(json.loads(match.group(1)))
    return found


def sync_episode_media(check_only: bool = False) -> int:
    site = _read(SITE)
    web_episodes = _read(WEB_EPISODES)
    podcast = _read(PODCAST_EPISODES)
    media = _read(EPISODE_MEDIA)
    albums = {album["id"]: album for album in _read(WEB_ALBUMS)}

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
        print(
            "Spotify: 認証情報(SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET/SPOTIFY_REFRESH_TOKEN)"
            "が無いため既存値を維持。SPOTIFY_REFRESH_TOKENはtools/spotify_authorize.pyで発行"
        )

    # Original-song previews: one page fetch per album, shared by its episodes.
    track_ids: dict[str, dict[int, str]] = {}
    for album_id in sorted({episode["album_id"] for episode in web_episodes}):
        catalogue = (albums.get(album_id) or {}).get("apple_music")
        if not catalogue:
            print(f"Apple Music: {album_id} は albums.json に apple_music が未設定")
            continue
        try:
            track_ids[album_id] = apple_music_track_ids(
                catalogue["album_id"], catalogue["slug"]
            )
        except Exception as error:  # noqa: BLE001 - one album must not stop the rest
            print(f"Apple Music: {album_id} の取得に失敗しました ({error})")
            track_ids[album_id] = {}

    changed = 0
    missing: list[str] = []
    no_preview: list[str] = []
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

        track_id = track_ids.get(episode["album_id"], {}).get(episode["track_number"])
        if track_id and entry.get("apple_music_track_id") != track_id:
            if not check_only:
                entry["apple_music_track_id"] = track_id
            changed += 1
        if not entry.get("apple_music_track_id") and not entry.get("apple_music_url"):
            no_preview.append(f"  {episode['id']} (第{number}回)")

        absent = [key for key in ("spotify", "apple_podcasts") if not podcast_urls.get(key)]
        if absent:
            missing.append(f"  {episode['id']} (第{number}回): {', '.join(absent)}")

    if not check_only and changed:
        _write(EPISODE_MEDIA, media)

    verb = "不足" if check_only else "更新"
    print(f"配信URL: {changed}件を{verb}")
    if no_preview:
        print(f"\n⚠️ 試聴(Original preview)が出ないエピソード {len(no_preview)}件:")
        print("\n".join(no_preview))
    if missing:
        print(f"\n⚠️ 配信URLが未設定のエピソード {len(missing)}件:")
        print("\n".join(missing))
    if missing or no_preview:
        return 1
    print("配信URL・試聴: すべての公開エピソードで設定済み")
    return 0


if __name__ == "__main__":
    sys.exit(sync_episode_media(check_only="--check" in sys.argv))
