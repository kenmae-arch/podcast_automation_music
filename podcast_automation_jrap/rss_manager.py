"""ポッドキャストRSSフィード(feed.xml)を生成・更新するモジュール。

エピソードのメタデータは docs/episodes.json に永続化し、
毎回そこから全エピソードを含むフィードを再生成する。
"""
import json
import logging
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path

from feedgen.feed import FeedGenerator

import config

logger = logging.getLogger(__name__)

EPISODES_JSON = config.DOCS_DIR / "episodes.json"


class RSSManager:
    def __init__(
        self,
        base_url: str | None = None,
        *,
        feed_base_url: str | None = None,
        media_base_url: str | None = None,
    ):
        # base_url は旧コードとテストの互換性のために残す。
        self.site_base_url = (base_url or config.SITE_BASE_URL).rstrip("/")
        self.feed_base_url = (feed_base_url or config.FEED_BASE_URL).rstrip("/")
        self.media_base_url = (media_base_url or config.MEDIA_BASE_URL).rstrip("/")

    def add_episode(
        self, title: str, description: str, audio_path: Path, image: str | None = None
    ) -> None:
        """エピソードを登録してフィードを再生成する。

        image: docs/ からの相対パス(例 "art/lux.jpg")。シリーズごとに
        エピソード個別のアートワークを出し分けたい場合に指定する。
        省略時は番組全体のカバー(config.PODCAST_COVER_FILE)が使われる。
        """
        episodes = self._load_episodes()
        entry = {
            "title": title,
            "description": description,
            "audio_file": audio_path.name,
            "size_bytes": audio_path.stat().st_size,
            "published": datetime.now(timezone.utc).isoformat(),
            # エピソードの同一性を示すID。音声を差し替えてファイル名(URL)を変えても
            # ここは変えないこと。変えると配信先で「別の新エピソード」として扱われる。
            "guid": f"{self.site_base_url}/audio/{audio_path.name}",
        }
        if image:
            entry["image"] = image
        episodes.append(entry)
        self._save_episodes(episodes)
        self._generate_feed(episodes)

    def _generate_feed(self, episodes: list[dict]) -> None:
        fg = FeedGenerator()
        fg.load_extension("podcast")
        fg.title(config.PODCAST_TITLE)
        fg.description(config.PODCAST_DESCRIPTION)
        fg.link(href=self.site_base_url, rel="alternate")
        fg.link(href=f"{self.feed_base_url}/feed.xml", rel="self")
        fg.language(config.PODCAST_LANGUAGE)
        fg.author({"name": config.PODCAST_AUTHOR, "email": config.PODCAST_EMAIL})
        cover_url = f"{self.media_base_url}/{config.PODCAST_COVER_FILE}"
        fg.image(url=cover_url, title=config.PODCAST_TITLE, link=self.site_base_url)
        fg.podcast.itunes_image(cover_url)
        fg.podcast.itunes_author(config.PODCAST_AUTHOR)
        fg.podcast.itunes_category(config.PODCAST_CATEGORY)
        fg.podcast.itunes_explicit("no")
        fg.podcast.itunes_owner(config.PODCAST_AUTHOR, config.PODCAST_EMAIL)
        if config.PODCAST_NEW_FEED_URL:
            fg.podcast.itunes_new_feed_url(config.PODCAST_NEW_FEED_URL)

        # feedgenは追加した逆順で出力するため、古い順に追加する
        for ep in episodes:
            fe = fg.add_entry()
            audio_url = f"{self.media_base_url}/audio/{ep['audio_file']}"
            # guid は音声URLと切り離して固定する(差し替え時に重複配信させないため)
            fe.id(ep.get("guid") or audio_url)
            fe.title(ep["title"])
            fe.description(ep["description"])
            fe.enclosure(audio_url, str(ep["size_bytes"]), "audio/mpeg")
            fe.published(datetime.fromisoformat(ep["published"]))
            # シリーズごとのエピソード・アートワーク(未指定なら番組カバーが使われる)
            if ep.get("image"):
                fe.podcast.itunes_image(
                    f"{self.media_base_url}/{ep['image'].lstrip('/')}"
                )

        config.FEED_PATH.parent.mkdir(parents=True, exist_ok=True)
        fg.rss_file(str(config.FEED_PATH), pretty=True)
        logger.info("RSSフィードを更新しました: %s (%d エピソード)", config.FEED_PATH, len(episodes))

    def regenerate(self) -> None:
        """保存済みメタデータからRSSだけを再生成する。

        ホスト移行でURLを切り替える際に、音声を再生成せず使用する。
        既存の guid は episodes.json の値をそのまま使う。
        """
        self._generate_feed(self._load_episodes())

    @staticmethod
    def _load_episodes() -> list[dict]:
        if EPISODES_JSON.exists():
            return json.loads(EPISODES_JSON.read_text(encoding="utf-8"))
        return []

    @staticmethod
    def _save_episodes(episodes: list[dict]) -> None:
        EPISODES_JSON.parent.mkdir(parents=True, exist_ok=True)
        EPISODES_JSON.write_text(
            json.dumps(episodes, ensure_ascii=False, indent=2), encoding="utf-8"
        )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    RSSManager().regenerate()
