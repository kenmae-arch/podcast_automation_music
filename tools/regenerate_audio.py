"""配信済みエピソードの音声を、台本から作り直す。

読み間違いの修正などで音声だけを差し替えたいときに使う。CURRICULUM.md の運用どおり、
- 音声ファイルは別名(`..._v2.mp3` → `_v3` …)で書き出す。配信先はURL単位でキャッシュ
  するため、同名で中身だけ差し替えても反映されない。
- docs/episodes.json の `guid` と `published` は変えない。guid を変えると配信先で
  「別の新エピソード」として重複する。

    python3 tools/regenerate_audio.py 140                # 通算140話を作り直す
    python3 tools/regenerate_audio.py 140 --check        # 読みチェックだけ(音声化しない)

台本は scripts/published/*_ep{NNN}.json から探す。main.py と同じく読みチェックを
ゲートにし、HIGH が残っていれば音声化せずに止まる。
"""
from __future__ import annotations

import argparse
import logging
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import config  # noqa: E402
from tools.check_reading import check  # noqa: E402

logger = logging.getLogger(__name__)
EPISODES_JSON = config.DOCS_DIR / "episodes.json"


def find_script(number: int) -> Path:
    matches = sorted(config.PUBLISHED_SCRIPTS_DIR.glob(f"*_ep{number:03d}.json"))
    if len(matches) != 1:
        raise FileNotFoundError(f"通算{number}話の台本が一意に見つかりません: {matches}")
    return matches[0]


def next_version_path(current: str) -> Path:
    """episode_140_2026-09-03.mp3 → _v2 / _v2 → _v3 …"""
    stem, ext = current.rsplit(".", 1)
    m = re.search(r"_v(\d+)$", stem)
    if m:
        stem = f"{stem[: m.start()]}_v{int(m.group(1)) + 1}"
    else:
        stem = f"{stem}_v2"
    return config.AUDIO_DIR / f"{stem}.{ext}"


def regenerate(number: int, check_only: bool = False) -> int:
    import json

    episodes = json.loads(EPISODES_JSON.read_text(encoding="utf-8"))
    if not 1 <= number <= len(episodes):
        raise IndexError(f"通算{number}話は存在しません(全{len(episodes)}話)")
    entry = episodes[number - 1]

    script_path = find_script(number)
    script = json.loads(script_path.read_text(encoding="utf-8"))
    if script["title"] != entry["title"]:
        raise ValueError(
            f"台本と episodes.json の題名が一致しません:\n  台本: {script['title']}\n  登録: {entry['title']}"
        )
    logger.info("対象: #%d %s (%s)", number, entry["title"], script_path.name)

    issues = [i for i in check(script["script"]) if i[0] == "HIGH"]
    if issues:
        for _, kind, matched, context in issues:
            logger.error("  [%s] %s  …%s…", kind, matched, context)
        logger.error("読みチェックで HIGH %d件。pronunciation_dict.json に登録してから再実行", len(issues))
        return 1
    logger.info("読みチェック: 問題なし")
    if check_only:
        return 0

    # feedgen 等は音声化するときだけ必要(--check を軽くしておく)
    from audio_generator import create_audio_generator
    from rss_manager import RSSManager
    from tools.sync_website_data import sync_website_data

    out = next_version_path(entry["audio_file"])
    logger.info("音声化: %s → %s", entry["audio_file"], out.name)
    create_audio_generator().generate(script["script"], out)

    entry["audio_file"] = out.name
    entry["size_bytes"] = out.stat().st_size
    # guid / published は据え置く(同一エピソードの差し替えとして扱われるように)
    EPISODES_JSON.write_text(json.dumps(episodes, ensure_ascii=False, indent=2), encoding="utf-8")
    RSSManager().regenerate()
    synced = sync_website_data()
    logger.info("完了: %s (Webサイトデータ %d件同期)", out.name, synced)
    return 0


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("number", type=int, help="通算の話数(docs/episodes.json の順番、1始まり)")
    ap.add_argument("--check", action="store_true", help="読みチェックのみ行い、音声化しない")
    a = ap.parse_args()
    sys.exit(regenerate(a.number, check_only=a.check))
