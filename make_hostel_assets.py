import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs("assets/hostel", exist_ok=True)

# 1. Generate Hostel Corridor / Balcony Background (480 x 680)
bg = Image.new("RGBA", (480, 680), (35, 45, 60, 255))
draw = ImageDraw.Draw(bg)

# Evening sky gradient
for y in range(350):
    ratio = y / 350.0
    # Sunset/dusk: from deep twilight blue to warm orange/amber
    r = int(25 * (1 - ratio) + 180 * ratio)
    g = int(35 * (1 - ratio) + 95 * ratio)
    b = int(75 * (1 - ratio) + 55 * ratio)
    draw.line([(0, y), (480, y)], fill=(r, g, b, 255))

# Distant hostel buildings & water tanks
# Water tank on rooftop
draw.rectangle([60, 220, 110, 270], fill=(70, 75, 85, 255))
draw.ellipse([60, 212, 110, 228], fill=(90, 95, 105, 255))
draw.line([85, 205, 85, 215], fill=(50, 50, 50, 255), width=3) # Pipe

draw.rectangle([340, 240, 395, 285], fill=(60, 65, 75, 255))
draw.ellipse([340, 233, 395, 247], fill=(80, 85, 95, 255))

# Hostel walls (warm yellowish-cream/grungy Indian hostel corridor)
draw.rectangle([0, 280, 480, 680], fill=(215, 195, 155, 255))
# Grungy stained wall texture lines
for y in range(280, 630, 24):
    draw.line([(0, y), (480, y)], fill=(195, 175, 135, 180), width=1)

# Corridor pillars & door frames
# Left door: Room 101
draw.rectangle([30, 340, 120, 580], fill=(130, 75, 45, 255))
draw.rectangle([40, 350, 110, 570], fill=(95, 50, 30, 255))
# Room 420 Board
draw.rectangle([42, 312, 112, 336], fill=(240, 230, 200, 255), outline=(50, 50, 50, 255), width=2)
draw.text((47, 318), "ROOM 420", fill=(180, 30, 30, 255))

# Middle balcony window & railing
draw.rectangle([180, 330, 300, 480], fill=(50, 65, 80, 255)) # Window opening
# Window bars
for wx in range(195, 290, 18):
    draw.line([(wx, 330), (wx, 480)], fill=(120, 130, 140, 255), width=3)

# Right door: Room 404
draw.rectangle([360, 340, 450, 580], fill=(130, 75, 45, 255))
draw.rectangle([370, 350, 440, 570], fill=(95, 50, 30, 255))
draw.rectangle([375, 315, 435, 335], fill=(240, 230, 200, 255), outline=(50, 50, 50, 255), width=2)
draw.text((377, 318), "ROOM 404", fill=(30, 50, 180, 255))

# Bunk bed silhouettes along the corridor edges
for x in (0, 445):
    draw.rectangle([x, 390, x + 35, 580], fill=(95, 72, 48, 255))
    draw.rectangle([x, 405, x + 35, 414], fill=(65, 50, 36, 255))
    draw.rectangle([x, 486, x + 35, 496], fill=(65, 50, 36, 255))
    draw.rectangle([x + 3, 375, x + 32, 390], fill=(135, 110, 78, 255))

# Balcony Clothesline strung across the scene!
for offset in [-60, 0, 60]:
    draw.arc([-50, 120 + offset, 530, 200 + offset], 0, 180, fill=(70, 60, 50, 255), width=2)

# Checkered tiled floor, visible behind the game floor strip
draw.rectangle([0, 580, 480, 680], fill=(170, 145, 110, 255))
for row in range(7):
    for col in range(8):
        x0, y0 = col * 60, 580 + row * 14
        color = (170, 145, 110, 255) if (row + col) % 2 == 0 else (205, 182, 145, 255)
        draw.rectangle([x0, y0, x0 + 59, y0 + 13], fill=color)
        draw.rectangle([x0, y0, x0 + 59, y0 + 13], outline=(125, 105, 80, 255), width=1)
draw.rectangle([0, 626, 480, 630], fill=(210, 160, 50, 255)) # Yellow caution stripe

bg.save("assets/hostel/hostel_bg.png")
print("Saved assets/hostel/hostel_bg.png")

# 2. Generate Top Obstacle: Hanging Clothes (Pants, Boxers, Shirts, Bananas!) (Width: 68, Height: 390)
top_obs = Image.new("RGBA", (68, 390), (0, 0, 0, 0))
t_draw = ImageDraw.Draw(top_obs)

# Main clothesline rope hanging down / pole
t_draw.line([(34, 0), (34, 380)], fill=(90, 80, 70, 255), width=4)

# 1. Hanging Blue Jeans / Pants (from y=20 to y=150)
# Clips on rope
t_draw.rectangle([20, 16, 26, 26], fill=(220, 50, 50, 255)) # Red clip
t_draw.rectangle([42, 16, 48, 26], fill=(50, 180, 50, 255)) # Green clip
# Jeans waist & legs
t_draw.polygon([(16, 26), (52, 26), (56, 75), (42, 150), (36, 150), (34, 85), (32, 150), (26, 150), (12, 75)], fill=(45, 85, 145, 255), outline=(30, 60, 110, 255))
# Pocket & seam stitches
t_draw.line([(18, 45), (30, 50)], fill=(220, 180, 50, 255), width=2)
t_draw.line([(50, 45), (38, 50)], fill=(220, 180, 50, 255), width=2)

# 2. Hanging Funny Red Polka-Dot Boxer / Underwear (y=160 to y=250)
t_draw.rectangle([18, 156, 24, 166], fill=(240, 200, 20, 255)) # Yellow clip
t_draw.rectangle([44, 156, 50, 166], fill=(240, 200, 20, 255))
# Boxer shape
t_draw.polygon([(14, 166), (54, 166), (58, 220), (44, 250), (36, 250), (34, 215), (32, 250), (24, 250), (10, 220)], fill=(225, 45, 55, 255), outline=(170, 25, 35, 255))
# Polka dots on boxer
for dx, dy in [(24, 180), (42, 185), (33, 198), (20, 215), (46, 225), (33, 235)]:
    t_draw.ellipse([dx - 3, dy - 3, dx + 3, dy + 3], fill=(255, 255, 255, 255))

# 3. Hanging Bunch of Yellow Bananas & Mangoes (y=260 to y=380)
# String holding bananas
t_draw.line([(34, 250), (34, 275)], fill=(110, 90, 60, 255), width=3)
# Banana bunch curve
t_draw.chord([12, 275, 45, 360], 45, 220, fill=(245, 210, 30, 255), outline=(160, 130, 10, 255))
t_draw.chord([25, 280, 58, 370], 50, 230, fill=(255, 225, 40, 255), outline=(160, 130, 10, 255))
t_draw.chord([20, 275, 50, 385], 40, 215, fill=(235, 200, 25, 255), outline=(150, 120, 10, 255))
# Banana tip green
t_draw.ellipse([30, 375, 38, 385], fill=(80, 160, 30, 255))
# Hanging clip at bottom end
t_draw.rectangle([30, 382, 38, 390], fill=(220, 50, 50, 255))

top_obs.save("assets/hostel/clothes_top.png")
print("Saved assets/hostel/clothes_top.png")

# 3. Generate Bottom Obstacle: Garbage Heap + GIANT DOG PEDA 💩 + Banana Peel (Width: 68, Height: 390)
bot_obs = Image.new("RGBA", (68, 390), (0, 0, 0, 0))
b_draw = ImageDraw.Draw(bot_obs)

# Top of obstacle: The legendary Dog Peda 💩 (Swirl Poop!)
# Base swirl
b_draw.chord([10, 20, 58, 65], 0, 180, fill=(125, 75, 35, 255), outline=(75, 45, 20, 255), width=2)
# Middle swirl
b_draw.chord([16, 10, 52, 45], 0, 180, fill=(138, 85, 40, 255), outline=(75, 45, 20, 255), width=2)
# Top peak swirl with cute twist
b_draw.polygon([(26, 12), (42, 12), (38, 0), (32, 2)], fill=(145, 90, 42, 255), outline=(75, 45, 20, 255))
# Googly cute / funny eyes on the poop
b_draw.ellipse([24, 25, 30, 33], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255))
b_draw.ellipse([27, 28, 29, 31], fill=(0, 0, 0, 255))
b_draw.ellipse([38, 25, 44, 33], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255))
b_draw.ellipse([40, 28, 42, 31], fill=(0, 0, 0, 255))

# Stink lines radiating up from dog peda
b_draw.arc([14, -12, 26, 4], 200, 340, fill=(130, 190, 40, 200), width=2)
b_draw.arc([42, -14, 54, 2], 200, 340, fill=(130, 190, 40, 200), width=2)

# Two green buzz flies 🪰 hovering near dog peda
b_draw.ellipse([6, 14, 12, 20], fill=(40, 180, 50, 255)) # Green fly body
b_draw.ellipse([4, 12, 8, 16], fill=(220, 240, 255, 180)) # Wing
b_draw.ellipse([56, 10, 62, 16], fill=(40, 180, 50, 255))
b_draw.ellipse([58, 8, 62, 12], fill=(220, 240, 255, 180))

# Yellow Slippery Banana Peel right under poop (y=62 to y=95)
b_draw.polygon([(20, 65), (48, 65), (58, 85), (50, 95), (34, 80), (18, 95), (10, 85)], fill=(250, 215, 30, 255), outline=(180, 140, 10, 255))
b_draw.line([(34, 65), (34, 80)], fill=(140, 90, 20, 255), width=2)

# Spilled Chai Glass / Hostel Mess Cup (y=95 to y=150)
b_draw.polygon([(22, 100), (46, 100), (42, 145), (26, 145)], fill=(230, 240, 250, 210), outline=(160, 180, 200, 255), width=2)
# Tea inside
b_draw.polygon([(24, 115), (44, 115), (41, 143), (27, 143)], fill=(185, 105, 45, 255))

# Hostel Dustbin / Trash Can cylinder (y=150 to y=390)
# Rim
b_draw.rectangle([8, 150, 60, 165], fill=(55, 120, 175, 255), outline=(35, 80, 120, 255), width=2)
# Body
b_draw.polygon([(10, 165), (58, 165), (55, 390), (13, 390)], fill=(40, 95, 145, 255), outline=(25, 65, 100, 255), width=2)
# Trash bin ribs
for ry in range(190, 380, 35):
    b_draw.line([(12, ry), (56, ry)], fill=(65, 140, 200, 255), width=3)

# Hostel sticker on bin
b_draw.rectangle([18, 230, 50, 260], fill=(255, 255, 255, 230))
b_draw.text((22, 236), "HOSTEL\n  BIN", fill=(10, 10, 10, 255))

bot_obs.save("assets/hostel/dog_peda_bottom.png")
print("Saved assets/hostel/dog_peda_bottom.png")
