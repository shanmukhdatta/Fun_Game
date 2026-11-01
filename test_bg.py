import argparse
import os
import numpy as np
from PIL import Image, ImageFilter

os.makedirs("assets/teja", exist_ok=True)
parser = argparse.ArgumentParser(description="Preview background removal against a source photo.")
parser.add_argument("source", help="Path to the original character photo")
src = parser.parse_args().source
img = Image.open(src).convert("RGBA")
arr = np.array(img, dtype=float)
h, w, _ = arr.shape

r = arr[:, :, 0]
g = arr[:, :, 1]
b = arr[:, :, 2]

# Compute background characteristics from border regions
# Wall color is warm beige/cream: high R and G, lower B, high brightness
brightness = (r + g + b) / 3.0
# In beige wall, R > G > B, with R ~ 180-210, G ~ 170-205, B ~ 140-180
# Shirt is plum/purple: R > B > G, and brightness < 120
# Headphones: G > R, vibrant
# Hair: very dark, brightness < 70
# Face: skin tone, brightness 120-170, R noticeably higher than B

# Measure color distance from typical beige wall (sampled from top region)
bg_ref = np.array([196.0, 190.0, 162.0])
dist_to_wall = np.sqrt((r - bg_ref[0])**2 + (g - bg_ref[1])**2 + (b - bg_ref[2])**2)

# Also check mirror on bottom right: mirror frame is dark brown/grey, reflection has light glare
# Let's inspect where the person is:
# We know the person connects continuously from center
mask = np.ones((h, w), dtype=bool)

# Initial wall detection: pixels close to beige wall
is_wall = (dist_to_wall < 40) & (brightness > 140)

# But keep face: face skin has (r - b) > 25 and (r - g) > 8, while wall has (r - g) < 10
# Also face center is around x in [100, 160], y in [45, 110]
y_coords, x_coords = np.ogrid[:h, :w]

# Anything that is clearly wall
mask[is_wall] = False

# Also top background above head (y < 45, except where green headphone band is at y~45-55)
# Headphone headband is dark green around x in [110, 150], y in [45, 60]
mask[:40, :] = False

# Right side mirror: x > 200 and y > 100
# Notice right arm goes up to around x=220, y in [100, 180]
# But beyond the arm, mirror frame is around x > 215, y > 140
# Let's look at the mask
print("Initial foreground pixels:", np.sum(mask))

# Let's save a preview to inspect
preview = np.zeros((h, w, 4), dtype=np.uint8)
preview[:, :, :3] = arr[:, :, :3].astype(np.uint8)
preview[:, :, 3] = (mask * 255).astype(np.uint8)
Image.fromarray(preview).save("assets/teja/mask_test1.png")
print("Saved mask_test1.png")
