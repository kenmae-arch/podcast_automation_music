"""台本の「読み事故」を音声生成前に検出するリンター。

日本語TTSが読み違えやすいパターンを、読み仮名辞書を適用した“後”のテキストに対して
検査する。辞書で解決済みなら検出されない = 「まだ辞書に入れていない危険語」だけが残る。

    python3 tools/check_reading.py                 # pending.json を検査
    python3 tools/check_reading.py --all           # 配信済み全話を検査
    python3 tools/check_reading.py <file.json>...  # ファイル指定

終了コード: HIGH が1件でもあれば 1(音声生成前のゲートに使える)
"""
import argparse
import json
import re
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE))

from audio_generator import apply_pronunciation_dict  # noqa: E402

# --- 検査ルール ---------------------------------------------------------

# 数字+助数詞。分/秒/日/月/人/階/本/杯 は audio_generator が数値から読みを
# 計算するので、変換後に残っていたら「対応していない助数詞」ということになる。
AMBIGUOUS_COUNTERS = "分秒日月人階本杯匹羽頭冊足膳"
RE_NUM_COUNTER = re.compile(rf"[0-9０-９]+[{AMBIGUOUS_COUNTERS}]")

# 「数〜」= すう と読ませたい語。かず と読まれる事故が起きる。
RE_SUU = re.compile(r"数[ヶかヵ箇]?[月年日週回人曲十百千万時][間後前]?")

# 日本語TTSに渡すと確実に崩れるラテン文字(辞書で置換されずに残ったもの)
RE_LATIN = re.compile(r"[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9'’&.\-]*")

# 文脈で読みが変わる語。誤りとは限らないので確認を促すだけ。
CONFUSABLES = {
    "十分": "じゅうぶん(充分) か じゅっぷん(10分) か",
    "一日": "いちにち か ついたち か",
    "一人": "ひとり か いちにん か",
    "二人": "ふたり か ににん か",
    "大分": "だいぶ か おおいた(地名) か",
    "何分": "なんぷん か なにぶん か",
    "一部": "いちぶ(部分) か いちぶ(1冊) か",
    "最中": "さなか か もなか か",
    "変化": "へんか か へんげ か",
    "生物": "せいぶつ か なまもの か",
    "上手": "じょうず か うわて か かみて か",
    "下手": "へた か したて か しもて か",
    "市場": "しじょう か いちば か",
    "一角": "いっかく か ひとかど か",
}


def numeric_counter_dict_keys() -> list[str]:
    """辞書のうち「数字+助数詞」形式の危険なキーを返す。

    例:「3分」を登録すると「53分」が「5さんぷん」に化ける。
    この形式は audio_generator の数値計算に任せ、辞書には入れない。
    (「50 Cent」「2Pac」のような数字始まりの固有名詞は安全なので対象外)
    """
    path = BASE / "pronunciation_dict.json"
    if not path.exists():
        return []
    bad = re.compile(rf"^[0-9０-９]+[{AMBIGUOUS_COUNTERS}]")
    return [k for k in json.loads(path.read_text(encoding="utf-8")) if bad.match(k)]


def check(text: str) -> list[tuple[str, str, str, str]]:
    """(severity, kind, matched, context) のリストを返す。"""
    applied = apply_pronunciation_dict(text)
    found: list[tuple[str, str, str, str]] = []

    def ctx(s: str, i: int, j: int) -> str:
        return s[max(0, i - 18):j + 18].replace("\n", " ")

    for m in RE_LATIN.finditer(applied):
        # 単独の記号や数字だけの断片は除く
        if not re.search(r"[A-Za-zÀ-ÿ]{2,}", m.group(0)):
            continue
        found.append(("HIGH", "未登録のラテン文字", m.group(0), ctx(applied, m.start(), m.end())))

    for m in RE_NUM_COUNTER.finditer(applied):
        found.append(("HIGH", "数字+助数詞(読み未対応)", m.group(0), ctx(applied, m.start(), m.end())))


    for m in RE_SUU.finditer(applied):
        found.append(("HIGH", "「数〜」(すう/かず)", m.group(0), ctx(applied, m.start(), m.end())))

    for word, why in CONFUSABLES.items():
        for m in re.finditer(re.escape(word), applied):
            found.append(("WARN", f"多音語: {why}", word, ctx(applied, m.start(), m.end())))

    return found


def load_scripts(paths: list[Path]) -> list[tuple[str, str]]:
    out = []
    for p in paths:
        data = json.loads(p.read_text(encoding="utf-8"))
        out.append((p.name, data["script"]))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="*", type=Path)
    ap.add_argument("--all", action="store_true", help="配信済み台本をすべて検査")
    ap.add_argument("--quiet-warn", action="store_true", help="WARN を表示しない")
    args = ap.parse_args()

    if args.all:
        paths = sorted((BASE / "scripts" / "published").glob("*.json"))
    elif args.files:
        paths = args.files
    else:
        paths = [BASE / "scripts" / "pending.json"]

    paths = [p for p in paths if p.exists()]
    if not paths:
        print("検査対象がありません")
        return 0

    high_total = warn_total = 0

    # 辞書そのものの健全性チェック(全体で1回)
    for key in numeric_counter_dict_keys():
        print(f"✗ [辞書に数字+助数詞のキー] {key}")
        print("      より大きな数の一部に誤マッチして壊します。辞書から削除してください")
        high_total += 1
    for name, script in load_scripts(paths):
        issues = check(script)
        if args.quiet_warn:
            issues = [i for i in issues if i[0] == "HIGH"]
        if not issues:
            continue
        print(f"\n■ {name}")
        for sev, kind, matched, context in issues:
            mark = "✗" if sev == "HIGH" else "△"
            print(f"  {mark} [{kind}] {matched}")
            print(f"      …{context}…")
            if sev == "HIGH":
                high_total += 1
            else:
                warn_total += 1

    print(f"\n=== 検査 {len(paths)} 件 / HIGH {high_total} 件, WARN {warn_total} 件 ===")
    if high_total:
        print("HIGH は読み仮名辞書(pronunciation_dict.json)に登録してから音声化してください。")
    return 1 if high_total else 0


if __name__ == "__main__":
    sys.exit(main())
