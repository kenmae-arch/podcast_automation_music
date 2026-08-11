"""ポッドキャストのアートワーク生成(フォールバック用)。

本番のアートワークはChatGPT等で生成した画像を使う運用(CURRICULUM.md 参照)。
このスクリプトはプログラム生成版のフォールバックで、本番ファイル
(docs/cover-v2.jpg / docs/art/malltape.jpg)は上書きせず、
docs/art_generated/ 以下に書き出す。

- docs/art_generated/cover.jpg    : 番組全体のカバー(チャンネル)案
- docs/art_generated/malltape.jpg : 第1弾 Mall Boyz『Mall Tape』のエピソード・アート案

※ 本番カバーを差し替えるときはファイル名の番号を上げ(cover-v2 → cover-v3)、
  config.PODCAST_COVER_FILE も合わせて更新すること。配信先がURL単位で
  キャッシュするため、同名のまま中身だけ差し替えても反映されない。

実在のアルバムジャケットは複製せず、作品のテーマから起こしたオリジナルの図案。
フォントは Noto Sans CJK JP / DejaVu(Linux) と macOS システムフォントの
どちらの環境でも動くよう、候補から見つかったものを使う。
共通の意匠(粒状感・ヴィネット・トラッキングした欧文＋日本語)でシリーズ感を出す。
"""
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

S = 3000          # 書き出しサイズ(正方形)
SMALL = 600       # グラデーション/マスクの内部生成サイズ(拡大して滑らかに)

OUT = Path(__file__).resolve().parent.parent / "docs" / "art_generated"


def _find_font(candidates):
    for path, index in candidates:
        if Path(path).exists():
            return path, index
    raise FileNotFoundError(f"フォントが見つかりません: {candidates}")


# 欧文ディスプレイ(セリフ)/ 欧文サンセリフ / 日本語
_LATIN_SERIF = _find_font([
    ("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 0),
    ("/System/Library/Fonts/Supplemental/Didot.ttc", 0),
])
_LATIN_SANS = _find_font([
    ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 0),
    ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 0),
    ("/System/Library/Fonts/Supplemental/Futura.ttc", 0),
])
_JP = _find_font([
    ("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", 0),
    ("/System/Library/Fonts/Hiragino Sans GB.ttc", 2),
])
_JP_LIGHT = _find_font([
    ("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", 0),
    ("/System/Library/Fonts/Hiragino Sans GB.ttc", 0),
])


def serif(size):
    return ImageFont.truetype(_LATIN_SERIF[0], size, index=_LATIN_SERIF[1])


def sans(size):
    return ImageFont.truetype(_LATIN_SANS[0], size, index=_LATIN_SANS[1])


def jp(size, bold=True):
    path, index = _JP if bold else _JP_LIGHT
    return ImageFont.truetype(path, size, index=index)


# ---------- 下地 ----------

def vgradient(stops):
    """縦グラデーション。stops: [(0..1, (r,g,b)), ...]"""
    strip = Image.new("RGB", (1, SMALL))
    px = strip.load()
    for y in range(SMALL):
        t = y / (SMALL - 1)
        c = stops[-1][1]
        for i in range(len(stops) - 1):
            p0, c0 = stops[i]
            p1, c1 = stops[i + 1]
            if p0 <= t <= p1:
                k = 0 if p1 == p0 else (t - p0) / (p1 - p0)
                k = k * k * (3 - 2 * k)  # smoothstep
                c = tuple(int(c0[j] + (c1[j] - c0[j]) * k) for j in range(3))
                break
        px[0, y] = c
    return strip.resize((S, S), Image.LANCZOS)


def radial_mask(cx, cy, radius, falloff=2.2):
    """中心が明るい円形マスク(L)。座標・半径は最終サイズ基準。"""
    k = SMALL / S
    m = Image.new("L", (SMALL, SMALL), 0)
    d = ImageDraw.Draw(m)
    steps = 140
    for i in range(steps, 0, -1):
        t = i / steps
        r = radius * k * t
        v = int(255 * ((1 - t) ** falloff))
        d.ellipse([cx * k - r, cy * k - r, cx * k + r, cy * k + r], fill=v)
    return m.resize((S, S), Image.LANCZOS).filter(ImageFilter.GaussianBlur(S // 260))


def glow(base, cx, cy, radius, color, falloff=2.2):
    base.paste(Image.new("RGB", base.size, color), (0, 0), radial_mask(cx, cy, radius, falloff))


def vignette(img, strength=0.6, radius_ratio=0.80):
    m = radial_mask(S / 2, S / 2, S * radius_ratio, falloff=1.5)
    inv = ImageChops.invert(m).point(lambda v: int(v * strength))
    img.paste(Image.new("RGB", img.size, (0, 0, 0)), (0, 0), inv)


def grain(img, amount=0.055, sigma=26):
    noise = Image.effect_noise((S, S), sigma).convert("RGB")
    return Image.blend(img, noise, amount)


# ---------- 文字 ----------

def tracked(draw, text, fnt, y, fill, tracking=0, cx=S / 2):
    """字間(トラッキング)を効かせた中央揃えテキスト。yはアセンダ基準の上端。"""
    widths = [draw.textlength(ch, font=fnt) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = cx - total / 2
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += w + tracking
    return total


class Stack:
    """字面(グリフ)の実寸で縦に積んでいくレイアウト。重なりと余白を正確に制御する。"""

    def __init__(self, draw, top):
        self.d = draw
        self.y = top

    def gap(self, px):
        self.y += px
        return self

    def text(self, text, fnt, fill, tracking=0):
        top_off, bot_off = fnt.getbbox(text)[1], fnt.getbbox(text)[3]
        tracked(self.d, text, fnt, self.y - top_off, fill, tracking)
        self.y += bot_off - top_off
        return self

    def rule(self, half_width, color, w=3):
        self.d.line([S / 2 - half_width, self.y, S / 2 + half_width, self.y], fill=color, width=w)
        self.y += w
        return self


# =====================================================================
# 1. 番組カバー ── 夜の街のイコライザー
# =====================================================================

def make_channel_cover():
    """夜のスカイラインがそのままイコライザーのバーになっている図案。
    「街の音楽=ラップ」を一枚で言う。ネオンのマゼンタ＋シアンの二灯。"""
    img = vgradient([(0.0, (10, 10, 22)), (0.5, (24, 16, 40)), (1.0, (14, 10, 24))])

    base_y = S * 0.560

    # 街の背後のネオン二灯
    glow(img, S * 0.30, base_y - S * 0.10, S * 0.34, (196, 60, 140), falloff=2.7)   # マゼンタ
    glow(img, S * 0.74, base_y - S * 0.14, S * 0.30, (54, 150, 196), falloff=2.7)   # シアン
    glow(img, S * 0.52, base_y - S * 0.05, S * 0.10, (255, 224, 200), falloff=1.9)

    # スカイライン=イコライザーのバー。高さは擬似ランダム(サイン合成)で固定
    bars = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bars)
    n = 27
    bw = S / n
    for i in range(n):
        t = i / (n - 1)
        h = 0.055 + 0.16 * abs(math.sin(i * 2.3) * 0.6 + math.sin(i * 0.9 + 1.2) * 0.4)
        x0, x1 = i * bw + bw * 0.16, (i + 1) * bw - bw * 0.16
        y0 = base_y - S * h
        # バー本体(シルエット)
        bd.rectangle([x0, y0, x1, base_y], fill=(10, 8, 16, 255))
        # 天面のネオンの縁。左からマゼンタ→シアンへ渡す
        r = int(224 - 150 * t)
        g = int(70 + 80 * t)
        b = int(150 + 60 * t)
        bd.rectangle([x0, y0 - 10, x1, y0 + 8], fill=(r, g, b, 255))
        # 窓の明かりを点々と
        rows = max(2, int(h * 26))
        for rr in range(rows):
            for cc in range(2):
                if (i * 7 + rr * 5 + cc * 3) % 4 == 0:
                    wx = x0 + (x1 - x0) * (0.24 + 0.44 * cc)
                    wy = y0 + (base_y - y0) * (rr + 0.4) / rows
                    bd.rectangle([wx, wy, wx + S * 0.006, wy + S * 0.009],
                                 fill=(255, 214, 150, 210))
    img = Image.alpha_composite(img.convert("RGBA"), bars).convert("RGB")

    # 地平線の一本線と、路面への反射
    d = ImageDraw.Draw(img)
    d.line([0, base_y, S, base_y], fill=(220, 140, 180), width=4)
    refl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    rd = ImageDraw.Draw(refl)
    y = base_y + 8
    while y < base_y + S * 0.06:
        t = (y - base_y) / (S * 0.06)
        rd.line([0, y, S, y], fill=(150, 80, 130, int(70 * (1 - t))), width=3)
        y += 9
    img = Image.alpha_composite(img.convert("RGBA"), refl).convert("RGB")
    d = ImageDraw.Draw(img)

    cream, neon, muted = (240, 234, 226), (238, 120, 178), (152, 146, 160)

    s = Stack(d, S * 0.660)
    s.text("J-RAP DEEP DIVE", sans(74), neon, tracking=44)
    s.gap(58).rule(S * 0.105, (120, 90, 120), 4).gap(72)
    s.text("日本語ラップ", jp(250), cream, tracking=14)
    s.gap(52).text("アルバム全曲解説", jp(148), cream, tracking=22)
    s.gap(64).text("名盤を、1曲ずつ。", jp(80, bold=False), muted, tracking=12)
    print("  cover type bottom:", int(s.y))

    vignette(img, 0.60, 0.82)
    return grain(img, 0.05)


# =====================================================================
# 2. 第1弾 Mall Boyz『Mall Tape』 ── 光へ昇るエスカレーター
# =====================================================================

def make_malltape():
    """閉店後のショッピングモール。吹き抜けのガラス天井から光が落ち、
    エスカレーターがその光に向かって昇っていく図案(=Higher)。
    「モール=原風景」というEPのコンセプトと、上昇のモチーフを一枚で言う。"""
    img = vgradient([(0.0, (238, 214, 170)), (0.30, (150, 120, 130)),
                     (0.62, (44, 34, 58)), (1.0, (16, 12, 26))])

    # 天頂の光(ガラス天井の外の空)
    glow(img, S * 0.50, S * 0.10, S * 0.42, (255, 224, 170), falloff=2.4)
    glow(img, S * 0.50, S * 0.08, S * 0.16, (255, 244, 216), falloff=1.7)

    # ガラス天井のグリッド(遠近をつけた台形)
    roof = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    rd = ImageDraw.Draw(roof)
    vx, vy = S * 0.50, S * 0.335       # 消失点
    top_y = S * 0.035
    for i in range(13):
        t = i / 12
        x_top = S * (0.06 + 0.88 * t)
        rd.line([x_top, top_y, vx + (x_top - vx) * 0.22, vy],
                fill=(90, 70, 100, 190), width=7)
    for j in range(6):
        t = j / 5
        y = top_y + (vy - top_y) * (t ** 1.5)
        spread = 1 - 0.78 * (t ** 1.5)
        rd.line([vx - S * 0.44 * spread, y, vx + S * 0.44 * spread, y],
                fill=(90, 70, 100, 170), width=5)
    img = Image.alpha_composite(img.convert("RGBA"), roof).convert("RGB")

    # 吹き抜けの各フロアの手すり(横線)と、フロアの窓明かり
    d = ImageDraw.Draw(img)
    floors = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    fd = ImageDraw.Draw(floors)
    for fy, alpha in ((0.47, 120), (0.60, 160), (0.73, 200)):
        y = S * fy
        fd.rectangle([0, y, S, y + S * 0.012], fill=(24, 18, 36, 255))
        fd.line([0, y, S, y], fill=(216, 170, 190, alpha), width=4)
        # 店舗のシャッターの淡い明かり
        for i in range(9):
            if (i * 5 + int(fy * 100)) % 3 == 0:
                x0 = S * (0.03 + 0.11 * i)
                fd.rectangle([x0, y - S * 0.052, x0 + S * 0.062, y - S * 0.006],
                             fill=(120, 90, 140, 60))
    img = Image.alpha_composite(img.convert("RGBA"), floors).convert("RGB")
    d = ImageDraw.Draw(img)

    # エスカレーター: 右下から中央の光へ昇っていく帯。
    # 本体を面(台形)で描き、内側に踏み段のハイライトを刻む
    esc = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ed = ImageDraw.Draw(esc)
    x0, y0 = S * 0.78, S * 0.88       # 乗り口(手前・幅広)
    x1, y1 = S * 0.44, S * 0.40       # 降り口(光の中・幅狭)
    w0, w1 = S * 0.085, S * 0.038     # 遠近で狭まる半幅
    ed.polygon([(x0 - w0, y0), (x0 + w0, y0), (x1 + w1, y1), (x1 - w1, y1)],
               fill=(22, 17, 34, 255))
    # 踏み段(帯の内側だけに刻む)
    steps = 17
    for i in range(1, steps):
        t = i / steps
        tt = t ** 1.08
        tx = x0 + (x1 - x0) * tt
        ty = y0 + (y1 - y0) * tt
        half = (w0 + (w1 - w0) * tt) * 0.92
        a = int(90 + 150 * t)
        ed.line([tx - half, ty, tx + half, ty], fill=(255, 216, 168, a),
                width=max(4, int(S * 0.0075 * (1 - 0.45 * t))))
    # 両側のハンドレール(明るい縁)
    for sign in (-1, 1):
        ed.line([x0 + sign * w0, y0, x1 + sign * w1, y1],
                fill=(255, 198, 148, 235), width=10)
    img = Image.alpha_composite(img.convert("RGBA"), esc).convert("RGB")
    d = ImageDraw.Draw(img)

    # 昇る先の光だまり
    glow(img, x1, y1 - S * 0.02, S * 0.10, (255, 238, 200), falloff=1.8)

    # 文字を置く下部を沈める
    scrim = Image.new("L", (1, SMALL), 0)
    sp = scrim.load()
    for y in range(SMALL):
        tt = y / (SMALL - 1)
        sp[0, y] = 0 if tt < 0.56 else int(215 * min(1.0, (tt - 0.56) / 0.18) ** 1.4)
    img.paste(Image.new("RGB", img.size, (10, 8, 18)), (0, 0),
              scrim.resize((S, S), Image.LANCZOS))
    d = ImageDraw.Draw(img)

    cream, gold, muted = (244, 236, 222), (232, 190, 120), (168, 156, 172)

    Stack(d, S * 0.028).text("SERIES 01", sans(58), (120, 100, 130), tracking=40)

    s = Stack(d, S * 0.700)
    s.text("MALL BOYZ", sans(92), gold, tracking=48)
    s.gap(58).text("MALL TAPE", serif(272), cream, tracking=26)
    s.gap(64).rule(S * 0.084, (128, 108, 96), 3).gap(52)
    s.text("全曲解説", jp(76), muted, tracking=26)
    print("  malltape type bottom:", int(s.y))

    vignette(img, 0.54, 0.84)
    return grain(img, 0.055)


def save(img, path, quality=88):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "JPEG", quality=quality, subsampling=1, optimize=True, progressive=True)
    print(f"{path.name}: {img.size[0]}x{img.size[1]} {path.stat().st_size/1024:.0f} KB")


if __name__ == "__main__":
    save(make_channel_cover(), OUT / "cover.jpg")
    save(make_malltape(), OUT / "malltape.jpg")
