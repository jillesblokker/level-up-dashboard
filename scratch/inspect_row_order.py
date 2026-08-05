from PIL import Image
import os

img_path = "/Users/jilles/Thrivehaven/public/images/character/sprites/count.png"
img = Image.open(img_path).convert("RGBA")
w, h = img.size
cell_w = w / 3.0
cell_h = h / 4.0

print(f"Image dimensions: {w}x{h}, cell: {cell_w}x{cell_h}")

for r in range(4):
    row_crop = img.crop((0, int(r * cell_h), w, int((r + 1) * cell_h)))
    out_p = f"/Users/jilles/Thrivehaven/scratch/count_row_{r}.png"
    row_crop.save(out_p)
    print(f"Saved row {r} crop to {out_p}")
