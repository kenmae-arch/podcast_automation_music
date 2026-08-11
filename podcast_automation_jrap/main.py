"""ポッドキャスト自動生成のメインスクリプト。

- manualモード(既定): scripts/pending.json の台本を音声化してRSS更新。
  台本はClaude Code等が事前に作成する(LLM API不要・無料)。
- gemini/groqモード: トピック取得 → LLMで台本生成 → 音声化 → RSS更新。
"""
import json
import logging
import shutil
import sys
from datetime import date

import config
from audio_generator import create_audio_generator
from rss_manager import RSSManager
from script_generator import create_script_generator
from topic_fetcher import RSSTopicFetcher

logger = logging.getLogger(__name__)


def _next_episode_number() -> int:
    """既存エピソード数から次の連番を求める。

    音声ファイル名を日付だけで決めると、同じ日に複数話を生成したときに
    ファイルが衝突して過去回を上書きしてしまう。連番を付与して防ぐ。
    """
    episodes_json = config.DOCS_DIR / "episodes.json"
    if episodes_json.exists():
        return len(json.loads(episodes_json.read_text(encoding="utf-8"))) + 1
    return 1


def main() -> int:
    try:
        is_manual = config.LLM_PROVIDER.lower() in ("manual", "claude")

        # 1. トピック取得(manualモードでは台本が既にあるため不要)
        topics = []
        if not is_manual:
            logger.info("=== 1/4 トピック取得 ===")
            topics = RSSTopicFetcher().fetch()

        # 2. 台本の取得・生成
        logger.info("=== 2/4 台本取得 (%s) ===", config.LLM_PROVIDER)
        episode = create_script_generator().generate(topics)
        logger.info("台本: %s (%d文字)", episode.title, len(episode.script))

        # 2.5 読みチェック(音声化前のゲート)
        #     未登録の固有名詞や助数詞は日本語TTSが読み違えるため、ここで止める。
        #     --skip-reading-check で明示的に飛ばせる。
        if "--skip-reading-check" in sys.argv:
            logger.warning("読みチェックをスキップしました(--skip-reading-check)")
        else:
            from tools.check_reading import check

            issues = [i for i in check(episode.script) if i[0] == "HIGH"]
            if issues:
                logger.error("=== 読みチェックで %d 件の問題が見つかりました ===", len(issues))
                for _, kind, matched, context in issues:
                    logger.error("  [%s] %s", kind, matched)
                    logger.error("      …%s…", context)
                logger.error(
                    "pronunciation_dict.json に読みを登録してから再実行してください"
                    "(意図的に無視する場合は --skip-reading-check)"
                )
                return 1
            logger.info("読みチェック: 問題なし")

        # 3. 音声生成
        logger.info("=== 3/4 音声生成 (Fish Audio: %s) ===", config.FISH_AUDIO_MODEL)
        seq = _next_episode_number()
        audio_path = config.AUDIO_DIR / f"episode_{seq:03d}_{date.today().isoformat()}.mp3"
        create_audio_generator().generate(episode.script, audio_path)

        # 4. RSSフィード更新
        logger.info("=== 4/4 RSSフィード更新 ===")
        RSSManager().add_episode(
            episode.title, episode.description, audio_path, image=episode.image
        )

        # manualモード: 使用済み台本をアーカイブして二重配信を防ぐ
        if is_manual and config.PENDING_SCRIPT_PATH.exists():
            config.PUBLISHED_SCRIPTS_DIR.mkdir(parents=True, exist_ok=True)
            archived = config.PUBLISHED_SCRIPTS_DIR / f"{date.today().isoformat()}_ep{seq:03d}.json"
            shutil.move(config.PENDING_SCRIPT_PATH, archived)
            logger.info("台本をアーカイブしました: %s", archived)

        logger.info("すべての処理が完了しました")
        return 0
    except Exception:
        logger.exception("処理中にエラーが発生しました")
        return 1


if __name__ == "__main__":
    sys.exit(main())
