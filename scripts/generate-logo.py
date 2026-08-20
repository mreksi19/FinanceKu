from PIL import Image, ImageDraw, ImageFilter
import math

# Palet warna FinanceKu
NAVY_FROM = (11, 18, 32)      # #0B1220
NAVY_TO = (27, 42, 68)        # #1B2A44
GREEN = (16, 185, 129)        # #10B981
MINT = (110, 231, 183)        # #6EE7B7
ORANGE = (245, 158, 11)       # #F59E0B
WHITE = (255, 255, 255)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def draw_radial_bg(size, c_center, c_edge):
    img = Image.new('RGB', (size, size))
    px = img.load()
    cx, cy = size / 2, size / 2
    max_dist = math.sqrt(cx**2 + cy**2)
    for y in range(size):
        for x in range(size):
            dist = math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / max_dist
            px[x, y] = lerp(c_center, c_edge, min(1, dist))
    return img

def rounded_rect(draw, xy, radius, fill):
    draw.rounded_rectangle(xy, radius=radius, fill=fill)

def draw_mark(size, transparent=False, content_scale=1.0):
    """Gambar simbol 'F' modern + 3 batang grafik + aksen koin, dengan supersampling 4x untuk anti-alias halus.
    content_scale < 1.0 memperkecil & memusatkan konten (dipakai untuk adaptive icon safe-zone)."""
    SS = 4
    S = size * SS

    if transparent:
        base = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    else:
        bg = draw_radial_bg(S, NAVY_TO, NAVY_FROM)
        base = bg.convert('RGBA')

    draw = ImageDraw.Draw(base)
    c = S / 2
    u = (S / 100.0) * content_scale  # unit skala, diperkecil untuk safe-zone

    # --- Batang huruf F (gradasi vertikal emerald -> mint) ---
    stem_w = 16 * u
    stem_x0 = c - 26 * u
    stem_y0 = c - 32 * u
    stem_y1 = c + 32 * u
    steps = 40
    for i in range(steps):
        t0 = i / steps
        t1 = (i + 1) / steps
        y0 = stem_y0 + (stem_y1 - stem_y0) * t0
        y1 = stem_y0 + (stem_y1 - stem_y0) * t1
        color = lerp(GREEN, MINT, t0)
        draw.rectangle([stem_x0, y0 - 1, stem_x0 + stem_w, y1 + 1], fill=color + (255,))
    # ujung membulat
    draw.ellipse([stem_x0, stem_y0 - stem_w/2, stem_x0 + stem_w, stem_y0 + stem_w/2], fill=GREEN + (255,))
    draw.ellipse([stem_x0, stem_y1 - stem_w/2, stem_x0 + stem_w, stem_y1 + stem_w/2], fill=MINT + (255,))

    # --- Bar atas F ---
    top_bar = [stem_x0, stem_y0 - 8*u, c + 20*u, stem_y0 + 8*u]
    rounded_rect(draw, top_bar, radius=8*u, fill=GREEN + (255,))

    # --- Bar tengah F ---
    mid_bar = [stem_x0, c - 7*u, c + 4*u, c + 7*u]
    rounded_rect(draw, mid_bar, radius=7*u, fill=GREEN + (255,))

    # --- 3 batang grafik pertumbuhan (kanan bawah) ---
    bar_w = 9 * u
    gap = 5 * u
    bx = c + 10 * u
    heights = [16*u, 26*u, 36*u]
    colors = [GREEN, MINT, (167, 243, 208)]
    base_y = c + 34 * u
    for i, (h, col) in enumerate(zip(heights, colors)):
        x0 = bx + i * (bar_w + gap)
        x1 = x0 + bar_w
        y0 = base_y - h
        y1 = base_y
        rounded_rect(draw, [x0, y0, x1, y1], radius=3*u, fill=col + (255,))

    # --- Aksen koin emas (kanan atas) ---
    coin_r = 11 * u
    coin_cx = c + 30 * u
    coin_cy = c - 34 * u
    # glow lembut
    glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse(
        [coin_cx - coin_r*1.8, coin_cy - coin_r*1.8, coin_cx + coin_r*1.8, coin_cy + coin_r*1.8],
        fill=ORANGE + (90,)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=6*u))
    base = Image.alpha_composite(base, glow)
    draw = ImageDraw.Draw(base)
    draw.ellipse(
        [coin_cx - coin_r, coin_cy - coin_r, coin_cx + coin_r, coin_cy + coin_r],
        fill=ORANGE + (255,), outline=(251, 191, 36, 255), width=int(2*u)
    )
    # Anak panah tren naik di dalam koin (simbol pertumbuhan, bukan huruf/simbol lain)
    ax0, ay0 = coin_cx - coin_r*0.45, coin_cy + coin_r*0.35
    ax1, ay1 = coin_cx + coin_r*0.45, coin_cy - coin_r*0.35
    line_w = max(2, int(2.2*u))
    draw.line([ax0, ay0, ax1, ay1], fill=(255,255,255,255), width=line_w)
    # kepala panah
    head = coin_r * 0.42
    draw.line([ax1, ay1, ax1 - head, ay1], fill=(255,255,255,255), width=line_w)
    draw.line([ax1, ay1, ax1, ay1 + head], fill=(255,255,255,255), width=line_w)

    # Downsample -> hasil halus (anti-alias)
    final = base.resize((size, size), Image.LANCZOS)
    return final

def make_monochrome(mark_img, size):
    """Versi monokrom putih untuk adaptive icon monochrome (Android 13+)."""
    mono = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    px_src = mark_img.convert('RGBA').load()
    px_dst = mono.load()
    for y in range(size):
        for x in range(size):
            r, g, b, a = px_src[x, y]
            if a > 20:
                px_dst[x, y] = (255, 255, 255, a)
    return mono

OUT = '/home/claude/FinanceKu/assets/images'

# 1. icon.png (utama, 1024, dengan background gelap penuh) - konten boleh lebih besar
icon = draw_mark(1024, transparent=False, content_scale=1.0)
icon.save(f'{OUT}/icon.png')

# 2. android-icon-foreground.png (transparan, diperkecil ke safe-zone ~65% agar tak terpotong mask)
fg = draw_mark(1024, transparent=True, content_scale=0.62)
fg.save(f'{OUT}/android-icon-foreground.png')

# 3. android-icon-background.png (solid navy, tanpa mark, untuk adaptive icon)
bg_only = draw_radial_bg(1024, NAVY_TO, NAVY_FROM)
bg_only.save(f'{OUT}/android-icon-background.png')

# 4. android-icon-monochrome.png (safe-zone sama dengan foreground)
mono = make_monochrome(fg, 1024)
mono.save(f'{OUT}/android-icon-monochrome.png')

# 5. splash-icon.png (transparan, sedikit diperkecil agar tak mepet tepi splash)
splash = draw_mark(1024, transparent=True, content_scale=0.8)
splash.save(f'{OUT}/splash-icon.png')

# 6. favicon.png (kecil, dengan background, untuk web)
favicon = draw_mark(196, transparent=False, content_scale=1.0)
favicon.save(f'{OUT}/favicon.png')

print("Semua ikon berhasil dibuat di", OUT)
