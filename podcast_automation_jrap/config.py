"""プロジェクト全体の設定。環境変数と定数を一元管理する。"""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DOCS_DIR = BASE_DIR / "docs"
AUDIO_DIR = DOCS_DIR / "audio"
FEED_PATH = DOCS_DIR / "feed.xml"

# --- APIキー ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
FISH_AUDIO_API_KEY = os.getenv("FISH_AUDIO_API_KEY", "")

# --- 台本生成設定 ---
# "manual": Claude Code等が書いた scripts/pending.json を使う(API不要・無料)
# "gemini" / "groq": LLM APIで自動生成
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "manual")
SCRIPTS_DIR = BASE_DIR / "scripts"
PENDING_SCRIPT_PATH = SCRIPTS_DIR / "pending.json"
PUBLISHED_SCRIPTS_DIR = SCRIPTS_DIR / "published"
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# --- TTS設定 ---
# 【重要】完全無料・フェアユースモデル。変更しないこと。
FISH_AUDIO_MODEL = "s2.1-pro-free"
FISH_AUDIO_API_URL = "https://api.fish.audio/v1/tts"
# 任意: 使いたい音声のリファレンスID(Fish Audioのボイスライブラリから取得)
FISH_AUDIO_REFERENCE_ID = os.getenv("FISH_AUDIO_REFERENCE_ID", "")
# 1リクエストあたりの最大文字数(超過時はチャンク分割して結合する)
TTS_CHUNK_SIZE = int(os.getenv("TTS_CHUNK_SIZE", "1500"))

# --- ニュース取得 ---
NEWS_FEED_URLS = [
    u.strip()
    for u in os.getenv(
        "NEWS_FEED_URLS",
        "https://news.yahoo.co.jp/rss/topics/top-picks.xml,"
        "https://www.nhk.or.jp/rss/news/cat0.xml",
    ).split(",")
    if u.strip()
]
MAX_TOPICS = int(os.getenv("MAX_TOPICS", "5"))

# --- ポッドキャスト情報(RSSフィードに使用) ---
PODCAST_TITLE = os.getenv("PODCAST_TITLE", "日本語ラップ アルバム全曲解説")
PODCAST_DESCRIPTION = os.getenv(
    "PODCAST_DESCRIPTION",
    "日本語ラップの名盤を1曲ずつ深掘り解説するポッドキャスト。"
    "制作背景・リリックのテーマ・音楽的な仕掛けを、1話1曲でじっくり語ります。",
)
PODCAST_AUTHOR = os.getenv("PODCAST_AUTHOR", "アルバム全曲解説")
PODCAST_EMAIL = os.getenv("PODCAST_EMAIL", "podcast@example.com")
PODCAST_LANGUAGE = os.getenv("PODCAST_LANGUAGE", "ja")
PODCAST_CATEGORY = os.getenv("PODCAST_CATEGORY", "Music")
# 番組カバー画像(docs/ 直下)のファイル名。
# 【重要】カバーを差し替えるときは中身だけでなく**ファイル名も変える**こと。
# Spotify等の配信先はアートワークをURL単位でキャッシュするため、同名のまま
# 差し替えても反映されない。cover-v1 → cover-v2 のように番号を上げる運用。
PODCAST_COVER_FILE = os.getenv("PODCAST_COVER_FILE", "cover-v1.jpg")
# Webサイト、RSS、メディアは別ホストへ移行できるように分離する。
# 未設定時は従来どおり SITE_BASE_URL 配下ですべて配信する。
SITE_BASE_URL = os.getenv(
    "SITE_BASE_URL", "https://kenmae-arch.github.io/podcast_automation_jrap"
).rstrip("/")
FEED_BASE_URL = os.getenv("FEED_BASE_URL", SITE_BASE_URL).rstrip("/")
MEDIA_BASE_URL = os.getenv("MEDIA_BASE_URL", SITE_BASE_URL).rstrip("/")
# 旧フィードを購読中のアプリに移行先を通知する。
PODCAST_NEW_FEED_URL = os.getenv("PODCAST_NEW_FEED_URL", "").strip()

# --- リトライ設定 ---
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "5"))
RETRY_BASE_DELAY = float(os.getenv("RETRY_BASE_DELAY", "2.0"))
