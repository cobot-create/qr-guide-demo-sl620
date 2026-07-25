import qrcode
from PIL import Image, ImageDraw, ImageFont
import os

URL = "https://cobot-create.github.io/qr-guide-demo-sl620/"
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

def find_font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc" if bold else "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/PingFang.ttc",
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                return ImageFont.truetype(c, size)
            except Exception:
                continue
    return ImageFont.load_default()

def make_qr_image(url, box_size=10, border=2):
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=box_size, border=border)
    qr.add_data(url)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white").convert("RGB")

def centered_text(draw, cx, y, text, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    draw.text((cx - w / 2, y), text, font=font, fill=fill)

def build_card(canvas_mm, qr_mm, title_ja, title_en, dpi, filename, footer=True):
    px_per_mm = dpi / 25.4
    W = int(canvas_mm[0] * px_per_mm)
    H = int(canvas_mm[1] * px_per_mm)
    qr_px = int(qr_mm * px_per_mm)

    canvas = Image.new("RGB", (W, H), "white")
    draw = ImageDraw.Draw(canvas)

    margin = int(6 * px_per_mm)
    draw.rectangle([margin // 2, margin // 2, W - margin // 2, H - margin // 2], outline=(60, 40, 30), width=max(2, int(0.6 * px_per_mm)))

    title_font = find_font(int(H * 0.055), bold=True)
    sub_font = find_font(int(H * 0.03))
    small_font = find_font(int(H * 0.022))

    y = margin
    centered_text(draw, W / 2, y, title_ja, title_font, (43, 36, 32))
    y += int(H * 0.075)
    centered_text(draw, W / 2, y, title_en, sub_font, (90, 80, 72))
    y += int(H * 0.06)

    qr_img = make_qr_image(URL, box_size=max(4, qr_px // 45))
    qr_img = qr_img.resize((qr_px, qr_px))
    qr_x = int((W - qr_px) / 2)
    canvas.paste(qr_img, (qr_x, y))
    y_after_qr = y + qr_px + int(H * 0.02)

    centered_text(draw, W / 2, y_after_qr, "スマホのカメラで読み取ってください", small_font, (43, 36, 32))
    y_after_qr += int(H * 0.035)
    centered_text(draw, W / 2, y_after_qr, "Scan with your phone camera", small_font, (90, 80, 72))

    if footer:
        y_footer = H - margin - int(H * 0.03)
        centered_text(draw, W / 2, y_footer, "MENU", small_font, (43, 36, 32))

    canvas.save(os.path.join(OUT_DIR, filename), dpi=(dpi, dpi))
    print(f"saved {filename}: {W}x{H}px @ {dpi}dpi ({canvas_mm[0]}x{canvas_mm[1]}mm)")

# 卓上サイズ（テーブルスタンド用・正方形に近い小型カード）
build_card(
    canvas_mm=(90, 90),
    qr_mm=55,
    title_ja="喫茶りんどう",
    title_en="Kissa Rindou",
    dpi=300,
    filename="qr-tabletop-90x90mm.png",
)

# レジ横サイズ（レジ横スタンド用・縦長A6相当）
build_card(
    canvas_mm=(105, 148),
    qr_mm=75,
    title_ja="メニューはこちら",
    title_en="View our menu",
    dpi=300,
    filename="qr-register-a6-105x148mm.png",
)

print("done")
