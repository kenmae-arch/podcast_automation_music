"""Fish Audio APIで台本テキストを音声化するモジュール。

長文はチャンク分割して個別に音声化し、pydubで結合する。
モデルは必ず s2.1-pro-free(完全無料・フェアユース)を指定する。
TTSが読み間違える固有名詞は pronunciation_dict.json の読み仮名に置換してから送信する。
"""
import io
import json
import logging
import re
from abc import ABC, abstractmethod
from pathlib import Path

import requests

import config
from utils import RetryableError, retry_with_backoff

logger = logging.getLogger(__name__)

PRONUNCIATION_DICT_PATH = config.BASE_DIR / "pronunciation_dict.json"


# --- 数字+助数詞の読み ----------------------------------------------------
# 辞書に「6分」などを列挙する方式は、必ず取りこぼしが出るうえに危険だった。
# 例: 辞書に「3分」があると「53分」が「5さんぷん」に壊れる。
# そこで数値から読みを計算し、辞書より先に適用する。

_DIGIT_KANA = {1: "いち", 2: "に", 3: "さん", 4: "よん", 5: "ご",
               6: "ろく", 7: "なな", 8: "はち", 9: "きゅう"}
_HUNDREDS = {3: "さんびゃく", 6: "ろっぴゃく", 8: "はっぴゃく"}


def _num_kana(n: int) -> str:
    """1〜999 を読み仮名にする。"""
    out = ""
    h, r = divmod(n, 100)
    if h:
        out += _HUNDREDS.get(h, ("" if h == 1 else _DIGIT_KANA[h]) + "ひゃく")
    t, o = divmod(r, 10)
    if t:
        out += ("" if t == 1 else _DIGIT_KANA[t]) + "じゅう"
    if o:
        out += _DIGIT_KANA[o]
    return out or "ぜろ"


def _by_last_digit(n: int, table: dict[int, str], zero_form: str) -> str:
    """下1桁で音が変わる助数詞(分・階・本など)。10の倍数は「じゅう」→「じゅっ」。"""
    last = n % 10
    head = n - last
    prefix = _num_kana(head) if head else ""
    if last == 0:
        return prefix[:-1] + zero_form   # にじゅう + っぷん -> にじゅっぷん
    return prefix + table[last]


_FUN = {1: "いっぷん", 2: "にふん", 3: "さんぷん", 4: "よんぷん", 5: "ごふん",
        6: "ろっぷん", 7: "ななふん", 8: "はっぷん", 9: "きゅうふん"}
_KAI = {1: "いっかい", 2: "にかい", 3: "さんがい", 4: "よんかい", 5: "ごかい",
        6: "ろっかい", 7: "ななかい", 8: "はっかい", 9: "きゅうかい"}
_HON = {1: "いっぽん", 2: "にほん", 3: "さんぼん", 4: "よんほん", 5: "ごほん",
        6: "ろっぽん", 7: "ななほん", 8: "はっぽん", 9: "きゅうほん"}
_HAI = {1: "いっぱい", 2: "にはい", 3: "さんばい", 4: "よんはい", 5: "ごはい",
        6: "ろっぱい", 7: "ななはい", 8: "はっぱい", 9: "きゅうはい"}
# 日は1〜10と14・20・24だけが不規則。それ以外は「〜にち」
_NICHI = {1: "ついたち", 2: "ふつか", 3: "みっか", 4: "よっか", 5: "いつか",
          6: "むいか", 7: "なのか", 8: "ようか", 9: "ここのか", 10: "とおか",
          14: "じゅうよっか", 20: "はつか", 24: "にじゅうよっか"}
_GATSU = {1: "いちがつ", 2: "にがつ", 3: "さんがつ", 4: "しがつ", 5: "ごがつ",
          6: "ろくがつ", 7: "しちがつ", 8: "はちがつ", 9: "くがつ",
          10: "じゅうがつ", 11: "じゅういちがつ", 12: "じゅうにがつ"}
_NIN = {1: "ひとり", 2: "ふたり", 4: "よにん"}

_COUNTER_RE = re.compile(r"(?<![0-9０-９])([0-9]{1,3})(分|秒|日|月|人|階|本|杯)")


def _counter_reading(m: re.Match) -> str:
    n, unit = int(m.group(1)), m.group(2)
    if unit == "分":
        return _by_last_digit(n, _FUN, "っぷん")
    if unit == "階":
        return _by_last_digit(n, _KAI, "っかい")
    if unit == "本":
        return _by_last_digit(n, _HON, "っぽん")
    if unit == "杯":
        return _by_last_digit(n, _HAI, "っぱい")
    if unit == "秒":
        return _num_kana(n) + "びょう"
    if unit == "日":
        return _NICHI.get(n) or (_num_kana(n) + "にち")
    if unit == "月":
        return _GATSU.get(n) or (_num_kana(n) + "がつ")
    if unit == "人":
        return _NIN.get(n) or (_num_kana(n) + "にん")
    return m.group(0)


def apply_counter_readings(text: str) -> str:
    """「53分」「21日」のような数字+助数詞を、数値から計算した読みに置換する。"""
    return _COUNTER_RE.sub(_counter_reading, text)


def apply_pronunciation_dict(text: str) -> str:
    """読み間違えやすい語を読み仮名に置換する。

    先に数字+助数詞を処理してから、辞書を長い語順に適用する。
    """
    text = apply_counter_readings(text)
    if not PRONUNCIATION_DICT_PATH.exists():
        return text
    mapping = json.loads(PRONUNCIATION_DICT_PATH.read_text(encoding="utf-8"))
    for word in sorted(mapping, key=len, reverse=True):
        text = text.replace(word, mapping[word])
    return text


class AudioGenerator(ABC):
    """音声生成のインターフェース。別のTTS APIに差し替え可能。"""

    @abstractmethod
    def generate(self, text: str, output_path: Path) -> Path: ...


class FishAudioGenerator(AudioGenerator):
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or config.FISH_AUDIO_API_KEY
        if not self.api_key:
            raise ValueError("FISH_AUDIO_API_KEY が設定されていません")

    def generate(self, text: str, output_path: Path) -> Path:
        text = apply_pronunciation_dict(text)
        chunks = self._split_text(text, config.TTS_CHUNK_SIZE)
        logger.info("テキストを%dチャンクに分割して音声化します", len(chunks))
        audio_parts = [self._synthesize_chunk(chunk) for chunk in chunks]

        output_path.parent.mkdir(parents=True, exist_ok=True)
        if len(audio_parts) == 1:
            output_path.write_bytes(audio_parts[0])
        else:
            self._concat_mp3(audio_parts, output_path)
        logger.info("音声を保存しました: %s (%.1f KB)", output_path, output_path.stat().st_size / 1024)
        return output_path

    @retry_with_backoff
    def _synthesize_chunk(self, text: str) -> bytes:
        payload: dict = {
            "text": text,
            "format": "mp3",
            "mp3_bitrate": 128,
        }
        if config.FISH_AUDIO_REFERENCE_ID:
            payload["reference_id"] = config.FISH_AUDIO_REFERENCE_ID

        response = requests.post(
            config.FISH_AUDIO_API_URL,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                # 【重要】モデル指定は必ず s2.1-pro-free(ヘッダーで指定する仕様)
                "model": config.FISH_AUDIO_MODEL,
            },
            json=payload,
            timeout=300,
        )
        if response.status_code == 429 or response.status_code >= 500:
            raise RetryableError(
                f"Fish Audio API {response.status_code}: {response.text[:200]}"
            )
        response.raise_for_status()
        return response.content

    @staticmethod
    def _split_text(text: str, chunk_size: int) -> list[str]:
        """文の区切り(。!? 改行)を優先してchunk_size以内に分割する。"""
        sentences = re.split(r"(?<=[。!?!?\n])", text)
        chunks: list[str] = []
        current = ""
        for sentence in sentences:
            if current and len(current) + len(sentence) > chunk_size:
                chunks.append(current)
                current = sentence
            else:
                current += sentence
        if current.strip():
            chunks.append(current)
        return [c for c in chunks if c.strip()]

    @staticmethod
    def _concat_mp3(parts: list[bytes], output_path: Path) -> None:
        try:
            from pydub import AudioSegment

            combined = AudioSegment.empty()
            for part in parts:
                combined += AudioSegment.from_file(io.BytesIO(part), format="mp3")
            combined.export(output_path, format="mp3", bitrate="128k")
        except Exception as e:
            # ffmpeg未導入環境向けフォールバック: 同一ビットレートのMP3は
            # フレーム単位のバイト連結でもほとんどのプレイヤーで再生可能
            logger.warning("pydubでの結合に失敗、バイト連結にフォールバックします: %s", e)
            output_path.write_bytes(b"".join(parts))


def create_audio_generator() -> AudioGenerator:
    """将来別のTTSに切り替える場合はここを変更する。"""
    return FishAudioGenerator()
