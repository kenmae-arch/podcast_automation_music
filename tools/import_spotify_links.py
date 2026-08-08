"""Import Spotify episode links collected by hand into episode-media.json.

Spotify's Web API refuses `GET /shows/{id}/episodes` unless the app owner
holds an active Premium subscription, and open.spotify.com disallows
automated crawlers in robots.txt. So the per-episode deep links have to be
gathered by a person — from Spotify for Creators (Episodes → ⋯ → Share
episode) or the Spotify app (right-click → Share → Copy link).

This script takes that pile of links and files them correctly. Paste one
episode per line, in any of these shapes:

    93  https://open.spotify.com/episode/2fbf...      # 通し話数
    discovery-10  https://open.spotify.com/episode/2fbf...   # エピソードID
    Daft Punk『Discovery』全曲解説 #10 ...  https://open.spotify.com/episode/2fbf...

Separator is whitespace or a comma, so a two-column spreadsheet paste works.
Lines that cannot be matched are reported and nothing is written for them —
a link filed against the wrong回 is worse than a missing one.

    python3 tools/import_spotify_links.py links.txt
    pbpaste | python3 tools/import_spotify_links.py -
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
WEB_DATA = ROOT / "web" / "src" / "data"
WEB_EPISODES = WEB_DATA / "episodes.json"
EPISODE_MEDIA = WEB_DATA / "episode-media.json"
PODCAST_EPISODES = ROOT / "docs" / "episodes.json"

EPISODE_URL = re.compile(r"https://open\.spotify\.com/(?:[a-z-]+/)?episode/([A-Za-z0-9]{22})")


def _read(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__, file=sys.stderr)
        return 1

    source = sys.stdin.read() if argv[1] == "-" else Path(argv[1]).read_text(encoding="utf-8")

    web_episodes = _read(WEB_EPISODES)
    podcast = _read(PODCAST_EPISODES)
    media = _read(EPISODE_MEDIA)

    # Three ways to name a回, so the paste can come from wherever it came from.
    by_id = {episode["id"]: episode for episode in web_episodes}
    by_number = {
        episode["episode_number"]: episode
        for episode in web_episodes
        if episode.get("episode_number")
    }
    by_title = {}
    for number, entry in enumerate(podcast, start=1):
        target = by_number.get(number)
        if target:
            by_title[entry.get("title", "").strip()] = target

    imported = 0
    unmatched: list[str] = []
    for raw in source.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        found = EPISODE_URL.search(line)
        if not found:
            unmatched.append(f"  URLなし: {line[:70]}")
            continue

        url = f"https://open.spotify.com/episode/{found.group(1)}"
        key = EPISODE_URL.sub("", line).strip().strip(",\t ").strip()

        target = by_id.get(key) or by_title.get(key)
        if target is None and key.isdigit():
            target = by_number.get(int(key))
        if target is None:
            unmatched.append(f"  該当話が不明: {key[:70] or '(識別子なし)'}")
            continue

        entry = media.setdefault(target["id"], {})
        entry.setdefault("podcast_urls", {})["spotify"] = url
        imported += 1

    if imported:
        EPISODE_MEDIA.write_text(
            json.dumps(media, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )

    print(f"Spotifyリンク: {imported}件を取り込みました")
    if unmatched:
        print(f"\n⚠️ 取り込めなかった行 {len(unmatched)}件:")
        print("\n".join(unmatched))
        return 1

    remaining = [
        episode["id"]
        for episode in web_episodes
        if episode.get("status") == "published"
        and not media.get(episode["id"], {}).get("podcast_urls", {}).get("spotify")
    ]
    if remaining:
        print(f"未設定のまま残っている公開エピソード: {len(remaining)}件")
    else:
        print("すべての公開エピソードにSpotifyリンクが設定されました")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
