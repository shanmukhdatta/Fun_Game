import argparse
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

parser = argparse.ArgumentParser(description="Create the character head crop used by the burst effect.")
parser.add_argument("source", help="Path to the original character photo")
src = parser.parse_args().source
img = Image.open(src).convert("RGBA")
arr = np.array(img, dtype=float)
h, w, _ = arr.shape

# Head region:
# y: 44 to 125
# x: 80 to 175
head_crop = img.crop((80, 44, 175, 125))
h_arr = np.array(head_crop, dtype=float)

# Background color difference in head box
bg_color = np.array([195.0, 187.0, 158.0])
dist = np.sqrt(np.sum((h_arr[:, :, :3] - bg_color)**2, axis=2))

# Mask: anything with dist > 26 or low brightness (hair) or green (headphones) or skin tone
is_head = (dist > 28) | (h_arr[:, :, :3].mean(axis=2) < 110)
# Clean borders
is_head[:5, :] = False
is_head = ndimage.binary_fill_holes(is_head)

# Largest connected component
labeled, num = ndimage.label(is_head)
if num > 0:
    sizes = ndimage.sum(is_head, labeled, range(1, num + 1))
    largest = np.argmax(sizes) + 1
    is_head = (labeled == largest)

is_head = ndimage.binary_fill_holes(is_head)
alpha = is_head.astype(float) * 255.0
alpha_img = Image.fromarray(alpha.astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))

res = Image.new("RGBA", head_crop.size, (0, 0, 0, 0))
res.paste(head_crop, (0, 0))
res.putalpha(alpha_img)
bbox = res.getbbox()
if bbox:
    res = res.crop(bbox)

res.save("assets/teja/teja_head.png")
print("Saved assets/teja/teja_head.png, size:", res.size)
