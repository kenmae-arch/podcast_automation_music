"""Instagram投稿カードの生成(4:5 / 1080x1350)。写真を主役にしたエディトリアル型。

背景に写真を全面配置し、暗いスクリム(グラデーションの覆い)を重ねてから
極太コンデンスの見出しを置く。Hypebeast系のレイアウトを想定。

    python3 tools/make_post.py posts/example.json

入力JSON:
{
  "slug": "lux-focu-ranni",
  "series": "lux",                    # 配色。lux/gkmc/lemonade/dtmf/okc/show
  "photo": "path/to/photo.jpg",       # 全カード共通の背景写真(任意)
  "kicker": "ROSALÍA / LUX",          # 見出しの上に小さく乗る欧文
  "hook": ["ロサリアという名前は", "聖女の名前だった"],
  "cards": [
    {"heading": "サンタ・ロサリア", "body": "…", "photo": "別の写真.jpg"}  # photoは任意
  ],
  "stat": {"value": "1625", "caption": "パレルモをペストから救った年"},   # 任意
  "credit": "Photo: ○○ / ○○",
  "outro": "『LUX』全18曲を1曲ずつ解説しています"
}

出力: out/instagram/<slug>/01.jpg …
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

BASE = Path(__file__).resolve().parent.parent
W, H = 1080, 1350
PAD = 64

F_COND = ("/System/Library/Fonts/Supplemental/Futura.ttc", 4)   # Condensed ExtraBold
F_FUTURA = ("/System/Library/Fonts/Supplemental/Futura.ttc", 0)  # Medium
F_JP_B = ("/System/Library/Fonts/Hiragino Sans GB.ttc", 2)       # W6
F_JP = ("/System/Library/Fonts/Hiragino Sans GB.ttc", 0)         # W3

ACCENTS = {
    "lux": (222, 190, 128), "gkmc": (226, 154, 78), "lemonade": (223, 176, 86),
    "dtmf": (232, 196, 118), "okc": (150, 200, 214), "show": (201, 162, 96),
}
LABELS = {
    "lux": "SERIES 01", "gkmc": "SERIES 02", "lemonade": "SERIES 03",
    "dtmf": "SERIES 04", "okc": "SERIES 05", "show": "ALBUM DEEP DIVE",
}
FALLBACK_ART = {"lux": "art/lux.jpg", "gkmc": "art/gkmc.jpg", "lemonade": "art/lemonade.jpg",
                "dtmf": "art/dtmf.jpg", "okc": "art/okc.jpg", "show": "cover-v2.jpg"}

WHITE = (255, 255, 255)


def font(spec, size):
    return ImageFont.truetype(spec[0], size, index=spec[1])


# ---------- 背景 ----------

def fill_crop(path: Path) -> Image.Image:
    """任意サイズの写真を 1080x1350 に中央クロップで敷き詰める。"""
    im = Image.open(path).convert("RGB")
    scale = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    left, top = (im.width - W) // 2, (im.height - H) // 3   # やや上寄り(顔が入りやすい)
    return im.crop((left, top, left + W, top + H))


def scrim(img, top_alpha=0, bottom_alpha=238, start=0.30):
    """下へ向かって濃くなる暗幕。写真の上でも文字が読めるようにする。"""
    grad = Image.new("L", (1, 256))
    px = grad.load()
    for y in range(256):
        t = y / 255
        t = 0.0 if t < start else (t - start) / (1 - start)
        px[0, y] = int(top_alpha + (bottom_alpha - top_alpha) * (t ** 1.35))
    mask = grad.resize((W, H), Image.LANCZOS)
    img.paste(Image.new("RGB", (W, H), (0, 0, 0)), (0, 0), mask)


def flat_dim(img, alpha=196, blur=3):
    """本文カード用。写真を沈めて長文を読ませる。"""
    if blur:
        img = img.filter(ImageFilter.GaussianBlur(blur))
    img = ImageEnhance.Color(img).enhance(0.55)
    img.paste(Image.new("RGB", (W, H), (0, 0, 0)),
              (0, 0), Image.new("L", (W, H), alpha))
    return img


def grain(img, amount=0.05):
    return Image.blend(img, Image.effect_noise((W, H), 20).convert("RGB"), amount)


# ---------- 文字 ----------

CLOSERS = "、。」』）,.!?！？"


def wrap_jp(text, per_line):
    lines, cur = [], ""
    for ch in text:
        cur += ch
        if len(cur) >= per_line:
            lines.append(cur)
            cur = ""
    if cur:
        lines.append(cur)
    fixed = []
    for line in lines:
        while fixed and line and line[0] in CLOSERS:
            fixed[-1] += line[0]
            line = line[1:]
        fixed.append(line)
    return [ln for ln in fixed if ln]


def tracked(d, text, fnt, x, y, fill, tracking=0):
    for ch in text:
        d.text((x, y), ch, font=fnt, fill=fill)
        x += d.textlength(ch, font=fnt) + tracking
    return x


def chip(d, text, accent):
    """左上のタグ。色ベタに濃い文字を抜く。"""
    fnt = font(F_FUTURA, 26)
    tw = sum(d.textlength(c, font=fnt) for c in text) + 12 * (len(text) - 1)
    d.rectangle([PAD, PAD, PAD + tw + 44, PAD + 56], fill=accent)
    tracked(d, text, fnt, PAD + 22, PAD + 14, (16, 16, 18), tracking=12)


def footer(d, accent, credit=""):
    y = H - PAD - 26
    d.rectangle([PAD, y - 18, PAD + 46, y - 14], fill=accent)
    tracked(d, "ALBUM DEEP DIVE", font(F_FUTURA, 24), PAD + 62, y - 26, (235, 235, 235), tracking=10)
    if credit:
        fnt = font(F_JP, 20)
        tw = sum(d.textlength(c, font=fnt) for c in credit)
        d.text((W - PAD - tw, y - 24), credit, font=fnt, fill=(168, 168, 172))


# ---------- カード ----------

def card_hook(bg, series, kicker, lines, credit):
    img = bg.copy()
    scrim(img, bottom_alpha=242, start=0.22)
    d = ImageDraw.Draw(img)
    accent = ACCENTS[series]
    chip(d, LABELS[series], accent)

    fnt = font(F_JP_B, 82)
    lh = 104
    y = H - PAD - 150 - lh * len(lines)
    if kicker:
        tracked(d, kicker.upper(), font(F_FUTURA, 30), PAD, y - 62, accent, tracking=14)
    for ln in lines:
        d.text((PAD, y), ln, font=fnt, fill=WHITE)
        y += lh
    d.rectangle([PAD, y + 34, PAD + 120, y + 40], fill=accent)
    footer(d, accent, credit)
    return grain(img)


def card_body(bg, series, heading, body):
    img = flat_dim(bg.copy())
    d = ImageDraw.Draw(img)
    accent = ACCENTS[series]
    chip(d, LABELS[series], accent)

    lines = wrap_jp(body, 21)
    block = (140 if heading else 0) + 68 * len(lines)
    y = (H - block) / 2 - 20
    if heading:
        d.text((PAD, y), heading, font=font(F_JP_B, 56), fill=accent)
        y += 92
        d.rectangle([PAD, y, PAD + 88, y + 5], fill=WHITE)
        y += 48
    for ln in lines:
        d.text((PAD, y), ln, font=font(F_JP, 42), fill=(240, 240, 242))
        y += 68
    footer(d, accent)
    return grain(img)


def card_stat(bg, series, value, caption):
    """数字で殴るカード。保存・シェアされやすい。"""
    img = bg.copy()
    scrim(img, top_alpha=120, bottom_alpha=236, start=0.0)
    d = ImageDraw.Draw(img)
    accent = ACCENTS[series]
    chip(d, LABELS[series], accent)

    fnt = font(F_COND, 300)
    tw = sum(d.textlength(c, font=fnt) for c in value) + 6 * (len(value) - 1)
    tracked(d, value, fnt, (W - tw) / 2, H * 0.30, WHITE, tracking=6)
    y = H * 0.63
    for ln in wrap_jp(caption, 18):
        f2 = font(F_JP_B, 44)
        w2 = sum(d.textlength(c, font=f2) for c in ln)
        d.text(((W - w2) / 2, y), ln, font=f2, fill=accent)
        y += 66
    footer(d, accent)
    return grain(img)


def card_outro(bg, series, text):
    img = flat_dim(bg.copy(), alpha=214, blur=6)
    d = ImageDraw.Draw(img)
    accent = ACCENTS[series]
    fnt = font(F_COND, 96)
    tw = sum(d.textlength(c, font=fnt) for c in "ALBUM DEEP DIVE") + 8 * 14
    tracked(d, "ALBUM DEEP DIVE", fnt, (W - tw) / 2, H * 0.34, WHITE, tracking=8)
    d.rectangle([W / 2 - 60, H * 0.47, W / 2 + 60, H * 0.475], fill=accent)

    y = H * 0.53
    for ln in wrap_jp(text, 24):
        f2 = font(F_JP, 38)
        w2 = sum(d.textlength(c, font=f2) for c in ln)
        d.text(((W - w2) / 2, y), ln, font=f2, fill=(238, 238, 240))
        y += 62
    f3 = font(F_JP, 30)
    t3 = "プロフィールのリンクから"
    w3 = sum(d.textlength(c, font=f3) for c in t3)
    d.text(((W - w3) / 2, H * 0.76), t3, font=f3, fill=accent)
    return grain(img)


# ---------- 組み立て ----------

def _bg(spec, override=None):
    path = override or spec.get("photo")
    if not path:
        path = BASE / "docs" / FALLBACK_ART[spec.get("series", "show")]
    return fill_crop(Path(path))


def build(spec: dict) -> Path:
    series = spec.get("series", "show")
    out = BASE / "out" / "instagram" / spec["slug"]
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.jpg"):
        old.unlink()

    base_bg = _bg(spec)
    pages = [card_hook(base_bg, series, spec.get("kicker", ""), spec["hook"], spec.get("credit", ""))]
    for c in spec.get("cards", []):
        bg = _bg(spec, c.get("photo")) if c.get("photo") else base_bg
        pages.append(card_body(bg, series, c.get("heading", ""), c["body"]))
    if spec.get("stat"):
        pages.append(card_stat(base_bg, series, spec["stat"]["value"], spec["stat"]["caption"]))
    if spec.get("outro"):
        pages.append(card_outro(base_bg, series, spec["outro"]))

    for i, p in enumerate(pages, 1):
        p.save(out / f"{i:02d}.jpg", "JPEG", quality=92, subsampling=1, optimize=True)
    print(f"{out}  ({len(pages)}枚)")
    return out


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    build(json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")))
