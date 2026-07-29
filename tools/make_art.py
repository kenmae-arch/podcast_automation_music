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
import random
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


# =====================================================================
# 4. 第3弾 Beyoncé『Lemonade』 ── 黄金の水面(オシュンと南部の夜)
# =====================================================================

def make_lemonade():
    horizon = S * 0.600
    img = vgradient([
        (0.0, (8, 24, 27)), (0.30, (16, 44, 44)), (0.50, (58, 66, 46)),
        (0.585, (152, 112, 42)), (0.601, (14, 30, 32)), (1.0, (7, 14, 17)),
    ])

    cx, sy = S / 2, horizon - S * 0.022
    glow(img, cx, sy, S * 0.34, (186, 136, 44), falloff=2.6)   # オシュンの黄金
    glow(img, cx, sy, S * 0.075, (255, 226, 152), falloff=1.8)

    d = ImageDraw.Draw(img)
    rr = S * 0.050
    d.ellipse([cx - rr, sy - rr, cx + rr, sy + rr], fill=(255, 233, 172))

    # 水面の反射(「When the Levee Breaks」の水、川の女神オシュン)
    ripples = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    rp = ImageDraw.Draw(ripples)
    random.seed(7)
    y = horizon + S * 0.006
    end = S * 0.735
    while y < end:
        t = (y - horizon) / (end - horizon)
        w = S * 0.018 + S * 0.105 * t + random.uniform(-S * 0.014, S * 0.014)
        a = int(165 * (1 - t) ** 1.25)
        off = random.uniform(-S * 0.012, S * 0.012)
        rp.line([cx - w + off, y, cx + w + off, y], fill=(255, 214, 140, a), width=5)
        y += S * 0.0092
    img = Image.alpha_composite(img.convert("RGBA"), ripples).convert("RGB")
    d = ImageDraw.Draw(img)

    # 南部の樹とサルオガセモドキ(スパニッシュモス)
    moss = (7, 17, 17)
    branch = []
    for i in range(41):
        t = i / 40
        branch.append((S * t, S * (0.052 + 0.030 * math.sin(t * 3.1 + 0.6))))
    for i in range(len(branch) - 1):
        d.line([branch[i], branch[i + 1]], fill=moss, width=int(S * 0.020), joint="curve")

    random.seed(3)
    for i in range(19):
        bx = S * (0.028 + 0.052 * i) + random.uniform(-S * 0.008, S * 0.008)
        by = S * (0.052 + 0.030 * math.sin((bx / S) * 3.1 + 0.6)) + S * 0.008
        length = random.uniform(S * 0.055, S * 0.195)
        seg = []
        for j in range(16):
            t = j / 15
            seg.append((bx + S * 0.016 * math.sin(t * 5.0 + i), by + length * t))
        for j in range(len(seg) - 1):
            w = max(3, int((14 - 11 * (j / len(seg))) * (S / 3000) * 1.6))
            d.line([seg[j], seg[j + 1]], fill=moss, width=w, joint="curve")

    cream, gold, muted = (240, 232, 214), (223, 176, 86), (150, 156, 148)

    Stack(d, S * 0.140).text("SERIES 03", font(F_FUTURA, 58, 0), muted, tracking=40)

    s = Stack(d, S * 0.735)
    s.text("BEYONCÉ", font(F_DIDOT, 142, 0), gold, tracking=52)
    s.gap(58).text("LEMONADE", font(F_DIDOT, 296, 2), cream, tracking=24)
    s.gap(68).rule(S * 0.084, (118, 106, 88), 3).gap(54)
    s.text("全曲解説", font(F_JP, 76, 0), muted, tracking=26)
    print("  lemonade type bottom:", int(s.y))

    vignette(img, 0.58, 0.84)
    return grain(img, 0.055)


# =====================================================================
# 5. 第4弾 Bad Bunny『Debí Tirar Más Fotos』 ── 撮り忘れた午後(プエルトリコ)
# =====================================================================

def make_dtmf():
    """カリブの午後の光、椰子、そして“写真”のフレーム。
    タイトル(=もっと写真を撮っておけばよかった)にちなみ、白フチの
    スナップ写真の枠を画面に据える。"""
    img = vgradient([
        (0.0, (18, 92, 132)), (0.34, (58, 148, 168)), (0.56, (150, 190, 168)),
        (0.655, (214, 176, 96)), (0.668, (30, 78, 74)), (1.0, (14, 44, 46)),
    ])

    horizon = S * 0.665
    glow(img, S * 0.50, horizon - S * 0.068, S * 0.32, (226, 168, 74), falloff=2.6)
    glow(img, S * 0.50, horizon - S * 0.068, S * 0.062, (255, 236, 176), falloff=1.8)

    d = ImageDraw.Draw(img)

    # 海の照り返し
    shim = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sp = ImageDraw.Draw(shim)
    random.seed(11)
    y = horizon + S * 0.005
    while y < S * 0.80:
        t = (y - horizon) / (S * 0.80 - horizon)
        w = S * 0.02 + S * 0.115 * t + random.uniform(-S * 0.015, S * 0.015)
        sp.line([S * 0.5 - w, y, S * 0.5 + w, y],
                fill=(255, 226, 160, int(140 * (1 - t) ** 1.3)), width=5)
        y += S * 0.0095
    img = Image.alpha_composite(img.convert("RGBA"), shim).convert("RGB")
    d = ImageDraw.Draw(img)

    # 椰子(両端に配置して写真の枠を邪魔しない)
    _palm(d, S * 0.085, horizon + S * 0.02, S * 0.40, lean=1.0, scale=1.05, col=(16, 46, 44))
    _palm(d, S * 0.945, horizon + S * 0.015, S * 0.33, lean=-1.15, scale=0.9, col=(16, 46, 44))

    # スナップ写真(ポラロイド風)。夕景そのものを“写真に収める”ように重ねる
    fw, fh = int(S * 0.520), int(S * 0.390)
    bw, bw_bottom = 34, 124
    frame = Image.new("RGBA", (fw, fh), (247, 244, 236, 236))
    ImageDraw.Draw(frame).rectangle(
        [bw, bw, fw - bw, fh - bw_bottom], fill=(0, 0, 0, 0)
    )
    frame = frame.rotate(-3.0, expand=True, resample=Image.BICUBIC)
    img = img.convert("RGBA")
    img.alpha_composite(
        frame,
        (int(S * 0.5 - frame.width / 2), int(S * 0.475 - frame.height / 2)),
    )
    img = img.convert("RGB")
    d = ImageDraw.Draw(img)

    cream, gold, muted = (243, 238, 226), (232, 196, 118), (176, 196, 192)

    Stack(d, S * 0.055).text("SERIES 04", font(F_FUTURA, 58, 0), (228, 240, 238), tracking=40)

    s = Stack(d, S * 0.700)
    s.text("BAD BUNNY", font(F_FUTURA, 88, 0), gold, tracking=46)
    s.gap(54).text("DEBÍ TIRAR", font(F_DIDOT, 180, 2), cream, tracking=18)
    s.gap(28).text("MÁS FOTOS", font(F_DIDOT, 180, 2), cream, tracking=18)
    s.gap(54).rule(S * 0.078, (126, 152, 146), 3).gap(48)
    s.text("全曲解説", font(F_JP, 72, 0), muted, tracking=26)
    print("  dtmf type bottom:", int(s.y))

    vignette(img, 0.52, 0.86)
    return grain(img, 0.058)


# =====================================================================
# 6. 第5弾 Radiohead『OK Computer』 ── 高速道路と、無機質な信号
# =====================================================================

def make_okc():
    """他4枚が自然物(光・街・水・夕景)なのに対し、この一枚だけは幾何学と機械。
    夜の高速道路を上から見た図と、淡々と流れる走査線で構成する。"""
    img = vgradient([
        (0.0, (14, 18, 24)), (0.42, (26, 34, 44)), (0.72, (40, 52, 62)),
        (1.0, (12, 15, 20)),
    ])

    d = ImageDraw.Draw(img)
    cx = S * 0.5
    vanish_y = S * 0.395           # 消失点
    road_y = S * 0.618             # 手前側
    half = S * 0.255               # 手前側の道幅(片側)

    # ヘッドライトの滲み(消失点の光)。線を描く前に置く
    glow(img, cx, vanish_y, S * 0.19, (104, 134, 166), falloff=2.8)
    glow(img, cx, vanish_y, S * 0.032, (224, 240, 255), falloff=1.9)

    # 道路は塗らず、収束する2本の路肩線と中央の破線だけで示す
    road = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    rd = ImageDraw.Draw(road)
    for sign in (-1, 1):
        rd.line([cx + sign * S * 0.004, vanish_y, cx + sign * half, road_y],
                fill=(176, 198, 214, 190), width=5)
    n = 22
    for i in range(n):
        t0 = i / n
        t1 = t0 + 0.030
        y0 = vanish_y + (road_y - vanish_y) * (t0 ** 1.8)
        y1 = vanish_y + (road_y - vanish_y) * (t1 ** 1.8)
        w0 = S * (0.0012 + 0.0072 * t0)
        w1 = S * (0.0012 + 0.0072 * t1)
        a = int(38 + 180 * t0)
        rd.polygon([(cx - w0, y0), (cx + w0, y0), (cx + w1, y1), (cx - w1, y1)],
                   fill=(228, 218, 184, a))
    img = Image.alpha_composite(img.convert("RGBA"), road).convert("RGB")
    d = ImageDraw.Draw(img)

    # 走査線(ブラウン管/端末の質感)
    scan = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scan)
    y = 0
    while y < S:
        sd.line([0, y, S, y], fill=(0, 0, 0, 34), width=2)
        y += 6
    img = Image.alpha_composite(img.convert("RGBA"), scan).convert("RGB")
    d = ImageDraw.Draw(img)

    # 幾何学的な枠(端末の窓)
    m = S * 0.070
    d.rectangle([m, m, S - m, S - m], outline=(150, 168, 186), width=4)
    for corner in ((m, m), (S - m, m), (m, S - m), (S - m, S - m)):
        d.rectangle([corner[0] - 16, corner[1] - 16, corner[0] + 16, corner[1] + 16],
                    fill=(196, 214, 230))

    cream, cyan, muted = (232, 240, 246), (150, 200, 214), (140, 158, 172)

    Stack(d, S * 0.108).text("SERIES 05", font(F_FUTURA, 58, 0), muted, tracking=40)

    s = Stack(d, S * 0.665)
    s.text("RADIOHEAD", font(F_FUTURA, 100, 0), cyan, tracking=54)
    s.gap(62).text("OK", font(F_DIDOT, 300, 2), cream, tracking=30)
    s.gap(24).text("COMPUTER", font(F_DIDOT, 232, 2), cream, tracking=20)
    s.gap(64).rule(S * 0.076, (120, 140, 156), 3).gap(52)
    s.text("全曲解説", font(F_JP, 74, 0), muted, tracking=26)
    print("  okc type bottom:", int(s.y))

    vignette(img, 0.56, 0.86)
    return grain(img, 0.062)


# =====================================================================
# 7. 第6弾 Daddy Yankee『Barrio Fino』 ── 団地の窓と、低音の輪
# =====================================================================

def make_barrio():
    """『上品な(fino)barrio』というタイトルの反転を、意匠で言う。
    第2弾GKMCが「夕景・ヤシ・電線」の情景なのに対し、こちらは正面からの幾何学。
    カセリオ(公営団地)の窓のグリッドを金で描き、そこからデンボウの低音が
    同心円で広がっていく構図。安価な素材を金に置き換える=barrio fino。"""
    img = vgradient([
        (0.0, (14, 8, 24)), (0.38, (34, 16, 34)), (0.66, (58, 28, 26)),
        (1.0, (12, 7, 14)),
    ])

    cx, cy = S / 2, S * 0.330

    # ナトリウム灯の橙。団地の背後から
    glow(img, cx, cy, S * 0.40, (198, 108, 40), falloff=2.6)
    glow(img, cx, cy, S * 0.11, (255, 210, 132), falloff=1.9)

    # 低音の同心円(デンボウの拍)。窓より先に置いて奥行きを出す
    rings = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rings)
    r = S * 0.08
    i = 0
    while r < S * 0.52:
        fade = 1 - (r / (S * 0.52)) ** 1.4
        a = int(30 + 108 * fade)
        col = (244, 192, 100, min(255, a + 54)) if i % 4 == 0 else (226, 206, 188, a)
        rd.ellipse([cx - r, cy - r, cx + r, cy + r], outline=col, width=8 if i % 4 == 0 else 4)
        r += S * 0.0215
        i += 1
    img = Image.alpha_composite(img.convert("RGBA"), rings).convert("RGB")

    # カセリオ(公営団地)を正面から。窓のグリッドだけで建物を示す
    d = ImageDraw.Draw(img)
    dark = (13, 8, 15)
    rnd = random.Random(2004)          # 発売年で固定。再生成しても同じ絵になる
    blocks = ((0.030, 0.215, 0.300), (0.265, 0.235, 0.212),
              (0.520, 0.225, 0.255), (0.775, 0.195, 0.180))
    base_y = S * 0.610
    for bx, bw, bh in blocks:
        x0, x1 = S * bx, S * (bx + bw)
        y0 = base_y - S * bh
        d.rectangle([x0, y0, x1, base_y], fill=dark)
        cols = max(3, int(bw / 0.052))
        rows = max(3, int(bh / 0.062))
        mw, mh = (x1 - x0) / cols, (base_y - y0) / rows
        for c in range(cols):
            for rr in range(rows):
                wx = x0 + mw * (c + 0.30)
                wy = y0 + mh * (rr + 0.34)
                ww, wh = mw * 0.40, mh * 0.34
                lit = rnd.random()
                if lit < 0.44:
                    col = (252, 208, 124) if lit < 0.30 else (238, 158, 84)
                else:
                    col = (32, 24, 30)
                d.rectangle([wx, wy, wx + ww, wy + wh], fill=col)

    # 手前の路面。金の一本線で締める
    d.rectangle([0, base_y, S, S], fill=(11, 7, 13))
    d.line([0, base_y, S, base_y], fill=(198, 152, 76), width=5)

    # 文字を置く下半分を沈める(窓の明滅と競合させない)
    scrim = Image.new("L", (1, SMALL), 0)
    sp = scrim.load()
    for y in range(SMALL):
        tt = y / (SMALL - 1)
        sp[0, y] = 0 if tt < 0.50 else int(225 * min(1.0, (tt - 0.50) / 0.16) ** 1.4)
    img.paste(Image.new("RGB", img.size, (8, 5, 10)), (0, 0),
              scrim.resize((S, S), Image.LANCZOS))
    d = ImageDraw.Draw(img)

    cream, gold, muted = (244, 234, 214), (232, 176, 74), (168, 146, 138)

    Stack(d, S * 0.075).text("SERIES 06", font(F_FUTURA, 58, 0), muted, tracking=40)

    s = Stack(d, S * 0.705)
    s.text("DADDY YANKEE", font(F_FUTURA, 86, 0), gold, tracking=44)
    s.gap(56).text("BARRIO", font(F_DIDOT, 232, 2), cream, tracking=24)
    s.gap(26).text("FINO", font(F_DIDOT, 232, 2), cream, tracking=24)
    s.gap(56).rule(S * 0.078, (146, 110, 62), 3).gap(50)
    s.text("全曲解説", font(F_JP, 74, 0), muted, tracking=26)
    print("  barrio type bottom:", int(s.y))

    vignette(img, 0.58, 0.84)
    return grain(img, 0.062)


def save(img, path, quality=88):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "JPEG", quality=quality, subsampling=1, optimize=True, progressive=True)
    print(f"{path.name}: {img.size[0]}x{img.size[1]} {path.stat().st_size/1024:.0f} KB")


if __name__ == "__main__":
    save(make_channel_cover(), OUT / COVER_FILE)
    save(make_lux(), OUT / "art" / "lux.jpg")
    save(make_gkmc(), OUT / "art" / "gkmc.jpg")
    save(make_lemonade(), OUT / "art" / "lemonade.jpg")
    save(make_dtmf(), OUT / "art" / "dtmf.jpg")
    save(make_okc(), OUT / "art" / "okc.jpg")
    save(make_barrio(), OUT / "art" / "barrio.jpg")
