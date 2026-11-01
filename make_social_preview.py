"""Create the 1200x630 Open Graph share card from the active character art."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
WIDTH, HEIGHT = 1200, 630

background = Image.open(ASSETS / "hostel" / "hostel_bg.png").convert("RGB")
background = ImageOps.fit(background, (WIDTH, HEIGHT), method=Image.Resampling.LANCZOS)
overlay = Image.new("RGBA", (WIDTH, HEIGHT), (9, 20, 29, 178))
card = Image.alpha_composite(background.convert("RGBA"), overlay)
draw = ImageDraw.Draw(card)

font_dir = Path("C:/Windows/Fonts")
try:
    title_font = ImageFont.truetype(str(font_dir / "arialbd.ttf"), 62)
    name_font = ImageFont.truetype(str(font_dir / "arialbd.ttf"), 82)
    body_font = ImageFont.truetype(str(font_dir / "arial.ttf"), 27)
    badge_font = ImageFont.truetype(str(font_dir / "arialbd.ttf"), 22)
except OSError:
    title_font = name_font = body_font = badge_font = ImageFont.load_default()

# Warm accent behind the character and a subtle card border.
draw.ellipse((820, 82, 1168, 570), fill=(27, 76, 90, 220), outline=(145, 221, 228, 255), width=5)
draw.rounded_rectangle((48, 48, 1152, 582), radius=38, outline=(168, 223, 227, 180), width=2)

draw.text((88, 148), "JUMPER TEJA", font=title_font, fill=(250, 252, 255, 255))
draw.text((84, 228), "GUNDU MAN", font=name_font, fill=(255, 193, 91, 255), stroke_width=1, stroke_fill=(57, 40, 24, 255))

badge = "HOSTEL FLAP CHALLENGE"
badge_box = draw.textbbox((0, 0), badge, font=badge_font)
badge_width = badge_box[2] - badge_box[0] + 36
draw.rounded_rectangle((90, 350, 90 + badge_width, 394), radius=18, fill=(168, 223, 227, 245))
draw.text((108, 358), badge, font=badge_font, fill=(13, 38, 46, 255))

draw.text((90, 430), "Dodge the laundry. Avoid dog peda.", font=body_font, fill=(237, 245, 247, 255))
draw.text((90, 472), "Keep Teja's gundu safe from FASAK!", font=body_font, fill=(237, 245, 247, 255))

hero = Image.open(ASSETS / "teja" / "teja_hero.png").convert("RGBA")
target_height = 420
target_width = round(hero.width * target_height / hero.height)
hero = hero.resize((target_width, target_height), Image.Resampling.LANCZOS)
card.alpha_composite(hero, (760, 108))

output = ASSETS / "teja" / "share_preview.png"
card.convert("RGB").save(output, "PNG", optimize=True)
print(f"Saved {output} ({WIDTH}x{HEIGHT})")
