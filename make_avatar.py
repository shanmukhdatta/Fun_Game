from PIL import Image, ImageDraw, ImageOps

# Load the active in-game character image.
hero = Image.open("assets/teja/teja_hero.png").convert("RGBA")
print("Teja cutout dimensions:", hero.size)

# Create a circular avatar for start & game over previews
avatar_size = (180, 180)
head = Image.open("assets/teja/teja_head.png").convert("RGBA")
# Center head on nice cinematic background
avatar = Image.new("RGBA", avatar_size, (29, 60, 74, 255))
# Scale head to fit
head_scaled = head.resize((150, int(150 * head.size[1] / head.size[0])), Image.Resampling.LANCZOS)
ox = (avatar_size[0] - head_scaled.size[0]) // 2
oy = (avatar_size[1] - head_scaled.size[1]) // 2
avatar.paste(head_scaled, (ox, oy), head_scaled)

# Circular mask
mask = Image.new("L", avatar_size, 0)
draw = ImageDraw.Draw(mask)
draw.ellipse((0, 0, avatar_size[0], avatar_size[1]), fill=255)
avatar.putalpha(mask)
avatar.save("assets/teja/teja_avatar.png")
print("Saved assets/teja/teja_avatar.png")
