import argparse
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

parser = argparse.ArgumentParser(description="Create a transparent character cutout.")
parser.add_argument("source", help="Path to the original character photo")
src = parser.parse_args().source
img = Image.open(src).convert("RGBA")
arr = np.array(img, dtype=float)
h, w, _ = arr.shape

# Convert to Lab or HSV for cleaner background separation
rgb = arr[:, :, :3] / 255.0

# Brightness
val = np.max(rgb, axis=2)
# Saturation
delta = np.max(rgb, axis=2) - np.min(rgb, axis=2)
sat = np.zeros_like(val)
nonzero = val > 0
sat[nonzero] = delta[nonzero] / val[nonzero]

# Wall reference:
# At y < 40, x in [10, 230]
wall_sample = arr[:30, 20:80, :3].mean(axis=(0, 1))
print("Wall sample RGB:", wall_sample)

# Color difference from wall sample
diff = np.sqrt(np.sum((arr[:, :, :3] - wall_sample)**2, axis=2))

# Background candidate: low saturation or close to wall color
# Face: skin has distinct R > G > B, saturation > 0.25, R > 130
# Shirt: plum/purple, B and R higher than G, val < 0.5
# Green headphones: G is much higher than R and B!
# Hair: dark, val < 0.35

is_person_feature = (
    # Dark hair or dark shirt
    (val < 0.46) |
    # Green headphones: green channel dominant
    ((arr[:, :, 1] > arr[:, :, 0] + 5) & (arr[:, :, 1] > arr[:, :, 2] + 15) & (arr[:, :, 1] > 60)) |
    # Shirt purple/maroon: R > G and B > G and val < 0.55
    ((arr[:, :, 0] > arr[:, :, 1] + 10) & (arr[:, :, 2] > arr[:, :, 1] + 2) & (val < 0.6)) |
    # Face skin: R > G + 10, G > B + 10, in central face box [45:120, 95:165]
    ((arr[:, :, 0] > arr[:, :, 1] + 8) & (arr[:, :, 1] > arr[:, :, 2] + 10) & (diff > 25))
)

# Mirror on bottom right: x > 200, y > 100
# Notice mirror has dark frame: x in [200, 243], y in [105, 236]
# Let's inspect right arm: right arm of shirt is at x in [160, 215], y in [100, 180]
# Outside right arm, x > 210 and y > 110 is mirror
is_mirror = (np.arange(w)[None, :] > 205) & (np.arange(h)[:, None] > 105)

# Clear background mask
is_bg = (diff < 42) & ~is_person_feature
is_bg[:40, :] = True # Top 40 rows are all above head
is_bg[:, :15] = True # Far left wall
is_bg[is_mirror] = True # Mirror frame on right

# Flood fill background from top border
bg_seeds = np.zeros((h, w), dtype=bool)
bg_seeds[0, :] = True
bg_seeds[:30, :30] = True
bg_seeds[:30, -30:] = True
bg_seeds[-30:, -30:] = True # Mirror corner

# Grow background into non-person regions
fg_mask = ~is_bg
# Fill holes inside the person
fg_mask = ndimage.binary_fill_holes(fg_mask)

# Keep largest connected component (the person)
labeled, num = ndimage.label(fg_mask)
sizes = ndimage.sum(fg_mask, labeled, range(1, num + 1))
if len(sizes) > 0:
    largest_label = np.argmax(sizes) + 1
    fg_mask = (labeled == largest_label)

# Smooth edges with slight dilation then erosion or alpha feathering
fg_mask = ndimage.binary_fill_holes(fg_mask)
fg_mask = ndimage.binary_closing(fg_mask, structure=np.ones((3, 3)))

# Create smooth alpha channel
alpha = fg_mask.astype(float) * 255.0
alpha_img = Image.fromarray(alpha.astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))

# Composite
result = Image.new("RGBA", (w, h), (0, 0, 0, 0))
result.paste(img, (0, 0))
result.putalpha(alpha_img)

# Crop to non-transparent bounding box
bbox = result.getbbox()
if bbox:
    cropped = result.crop(bbox)
else:
    cropped = result

cropped.save("assets/teja/teja_cutout.png")
print("Saved assets/teja/teja_cutout.png with size:", cropped.size)
