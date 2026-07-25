"""ポッドキャストのアートワーク生成。

- docs/cover-v2.jpg : 番組全体のカバー(チャンネル)
  ※ 差し替えるときは COVER_FILE の番号を上げ、config.PODCAST_COVER_FILE も
    合わせて更新すること。配信先がURL単位でキャッシュするため、同名のまま
    中身だけ差し替えても反映されない。
- docs/art/lux.jpg  : 第1弾 Rosalía『LUX』のエピソード・アート
- docs/art/gkmc.jpg : 第2弾 Kendrick Lamar『good kid, m.A.A.d city』のエピソード・アート

実在のアルバムジャケットは複製せず、作品のテーマから起こしたオリジナルの図案。
macOS のシステムフォント(Didot / Futura / Avenir Next / Hiragino)を使用。
共通の意匠(粒状感・ヴィネット・トラッキングした欧文＋日本語)でシリーズ感を出す。
"""
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

S = 3000          # 書き出しサイズ(正方形)
SMALL = 600       # グラデーション/マスクの内部生成サイズ(拡大して滑らかに)

OUT = Path(__file__).resolve().parent.parent / "docs"
COVER_FILE = "cover-v2.jpg"   # config.PODCAST_COVER_FILE と揃えること

F_DIDOT = "/System/Library/Fonts/Supplemental/Didot.ttc"
F_FUTURA = "/System/Library/Fonts/Supplemental/Futura.ttc"
F_AVENIR = "/System/Library/Fonts/Avenir Next.ttc"
F_JP = "/System/Library/Fonts/Hiragino Sans GB.ttc"


def font(path, size, index=0):
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
# 1. 番組カバー ── レコードの溝と、灯り
# =====================================================================

def make_channel_cover():
    img = vgradient([(0.0, (13, 13, 16)), (0.55, (22, 19, 19)), (1.0, (30, 23, 18))])

    cx, cy = S / 2, S * 0.415
    glow(img, cx, cy, S * 0.40, (196, 150, 86), falloff=2.6)   # 中心の灯り
    glow(img, cx, cy, S * 0.13, (255, 226, 178), falloff=2.0)

    # レコードの溝(同心円)
    rings = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rings)
    r = S * 0.085
    i = 0
    while r < S * 0.46:
        fade = 1 - (r / (S * 0.46)) ** 1.7
        a = int(46 + 78 * fade)
        col = (236, 216, 184, a) if i % 7 else (214, 172, 104, min(255, a + 46))
        rd.ellipse([cx - r, cy - r, cx + r, cy + r], outline=col, width=3)
        r += S * 0.0122
        i += 1
    img = Image.alpha_composite(img.convert("RGBA"), rings).convert("RGB")

    # 中心のレーベル部
    d = ImageDraw.Draw(img)
    rr = S * 0.052
    d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(24, 19, 16), outline=(201, 162, 96), width=5)
    d.ellipse([cx - 14, cy - 14, cx + 14, cy + 14], fill=(201, 162, 96))

    gold, cream, muted = (201, 162, 96), (240, 233, 219), (150, 141, 128)

    s = Stack(d, S * 0.700)
    s.text("ALBUM DEEP DIVE", font(F_FUTURA, 74, 0), gold, tracking=44)
    s.gap(58).rule(S * 0.105, (134, 113, 80), 4).gap(72)
    s.text("アルバム全曲解説", font(F_JP, 238, 2), cream, tracking=16)
    s.gap(74).text("名盤を、1曲ずつ。", font(F_JP, 82, 0), muted, tracking=12)
    print("  cover type bottom:", int(s.y))

    vignette(img, 0.62, 0.80)
    return grain(img, 0.05)


# =====================================================================
# 2. 第1弾 Rosalía『LUX』 ── 光背(ひかり)
# =====================================================================

def make_lux():
    img = vgradient([(0.0, (11, 13, 34)), (0.45, (32, 20, 54)), (1.0, (13, 11, 30))])

    cx, cy = S / 2, S * 0.395

    # 放射する光条
    rays = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rays)
    n = 96
    for i in range(n):
        a = 2 * math.pi * i / n
        long_ray = (i % 4 == 0)
        r0 = S * 0.115
        r1 = S * (0.46 if long_ray else 0.335)
        w = 7 if long_ray else 4
        alpha = 128 if long_ray else 74
        rd.line([cx + r0 * math.cos(a), cy + r0 * math.sin(a),
                 cx + r1 * math.cos(a), cy + r1 * math.sin(a)],
                fill=(255, 232, 190, alpha), width=w)
    rays = rays.filter(ImageFilter.GaussianBlur(4))
    img = Image.alpha_composite(img.convert("RGBA"), rays).convert("RGB")

    # 光輪
    glow(img, cx, cy, S * 0.36, (150, 120, 190), falloff=2.8)
    glow(img, cx, cy, S * 0.155, (255, 236, 198), falloff=2.1)
    glow(img, cx, cy, S * 0.055, (255, 252, 244), falloff=1.6)

    d = ImageDraw.Draw(img)
    arcs = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ad = ImageDraw.Draw(arcs)
    for rr, a in ((S * 0.205, 92), (S * 0.245, 58), (S * 0.300, 34)):
        ad.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=(255, 236, 205, a), width=3)
    img = Image.alpha_composite(img.convert("RGBA"), arcs).convert("RGB")
    d = ImageDraw.Draw(img)

    cream, gold, muted = (243, 236, 222), (222, 190, 128), (168, 156, 178)

    Stack(d, S * 0.068).text("SERIES 01", font(F_FUTURA, 58, 0), muted, tracking=40)

    s = Stack(d, S * 0.660)
    s.text("ROSALÍA", font(F_DIDOT, 146, 0), gold, tracking=54)
    s.gap(64).text("LUX", font(F_DIDOT, 430, 2), cream, tracking=30)
    s.gap(76).rule(S * 0.086, (128, 112, 104), 3).gap(58)
    s.text("全曲解説", font(F_JP, 78, 0), muted, tracking=26)
    print("  lux type bottom:", int(s.y))

    vignette(img, 0.6, 0.82)
    return grain(img, 0.05)


# =====================================================================
# 3. 第2弾 Kendrick Lamar『good kid, m.A.A.d city』 ── 夜のコンプトン
# =====================================================================

def _palm(d, x, base_y, h, lean=1.0, scale=1.0, col=(9, 8, 12)):
    """幹＋葉のシルエット。"""
    top_x = x + 120 * lean * scale
    top_y = base_y - h
    pts = []
    for i in range(21):
        t = i / 20
        px = x + (top_x - x) * (t ** 1.6)
        py = base_y - h * t
        pts.append((px, py))
    for i in range(len(pts) - 1):
        w = int((34 - 22 * (i / len(pts))) * scale)
        d.line([pts[i], pts[i + 1]], fill=col, width=max(4, w), joint="curve")

    for k in range(9):
        ang = math.pi * (0.06 + 0.98 * k / 8) + math.pi  # 上向きに扇状
        length = (300 + 130 * math.sin(k * 1.7)) * scale
        seg = []
        for j in range(15):
            t = j / 14
            rr = length * t
            sag = 210 * scale * (t ** 2.1)
            seg.append((top_x + rr * math.cos(ang), top_y + rr * math.sin(ang) + sag))
        for j in range(len(seg) - 1):
            w = int((26 - 22 * (j / len(seg))) * scale)
            d.line([seg[j], seg[j + 1]], fill=col, width=max(3, w), joint="curve")


def make_gkmc():
    horizon = S * 0.615
    img = vgradient([
        (0.0, (9, 13, 34)), (0.34, (26, 26, 58)), (0.52, (72, 46, 62)),
        (0.605, (150, 88, 60)), (0.618, (26, 20, 26)), (1.0, (12, 10, 15)),
    ])

    # 街灯の光
    glow(img, S * 0.735, horizon - S * 0.055, S * 0.30, (206, 118, 52), falloff=2.7)
    glow(img, S * 0.735, horizon - S * 0.055, S * 0.055, (255, 214, 150), falloff=1.8)
    glow(img, S * 0.22, horizon - S * 0.01, S * 0.16, (150, 74, 60), falloff=2.6)

    d = ImageDraw.Draw(img)
    dark = (9, 8, 12)

    # 電線と電柱
    d.rectangle([S * 0.735 - 9, horizon - S * 0.30, S * 0.735 + 9, horizon], fill=dark)
    d.line([S * 0.735, horizon - S * 0.30, S * 0.700, horizon - S * 0.312], fill=dark, width=9)
    d.ellipse([S * 0.700 - 34, horizon - S * 0.327, S * 0.700 + 34, horizon - S * 0.297],
              fill=(255, 205, 140))
    for off, sag in ((0.020, 0.052), (0.041, 0.064)):
        pts = []
        for i in range(41):
            t = i / 40
            y = horizon - S * (0.30 - off) + S * sag * math.sin(math.pi * t)
            pts.append((S * t, y))
        d.line(pts, fill=(14, 12, 18), width=6, joint="curve")

    # ヤシの木
    _palm(d, S * 0.135, horizon + S * 0.010, S * 0.375, lean=1.0, scale=1.0)
    _palm(d, S * 0.345, horizon + S * 0.004, S * 0.265, lean=-0.7, scale=0.74)
    _palm(d, S * 0.905, horizon + S * 0.008, S * 0.315, lean=-1.1, scale=0.86)

    # 遠景の街並み
    for bx, bw, bh in ((0.44, 0.075, 0.052), (0.52, 0.05, 0.035), (0.58, 0.062, 0.045),
                       (0.655, 0.04, 0.03), (0.03, 0.06, 0.04)):
        d.rectangle([S * bx, horizon - S * bh, S * (bx + bw), horizon], fill=(15, 13, 20))

    # シネマスコープの黒帯("A Short Film" への目配せ)
    bar = int(S * 0.072)
    d.rectangle([0, 0, S, bar], fill=(0, 0, 0))
    d.rectangle([0, S - bar, S, S], fill=(0, 0, 0))

    cream, amber, muted = (238, 231, 218), (226, 154, 78), (156, 148, 140)

    Stack(d, S * 0.100).text("SERIES 02", font(F_FUTURA, 58, 0), muted, tracking=40)

    s = Stack(d, S * 0.650)
    s.text("KENDRICK LAMAR", font(F_FUTURA, 80, 0), amber, tracking=40)
    s.gap(66).text("good kid,", font(F_AVENIR, 208, 2), cream, tracking=6)
    s.gap(46).text("m.A.A.d city", font(F_AVENIR, 208, 2), cream, tracking=6)
    s.gap(70).rule(S * 0.082, (112, 98, 88), 3).gap(54)
    s.text("全曲解説", font(F_JP, 74, 0), muted, tracking=26)
    print("  gkmc type bottom:", int(s.y), "/ letterbox starts:", int(S - S * 0.072))

    vignette(img, 0.55, 0.86)
    return grain(img, 0.062)


def save(img, path, quality=88):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "JPEG", quality=quality, subsampling=1, optimize=True, progressive=True)
    print(f"{path.name}: {img.size[0]}x{img.size[1]} {path.stat().st_size/1024:.0f} KB")


if __name__ == "__main__":
    save(make_channel_cover(), OUT / COVER_FILE)
    save(make_lux(), OUT / "art" / "lux.jpg")
    save(make_gkmc(), OUT / "art" / "gkmc.jpg")
