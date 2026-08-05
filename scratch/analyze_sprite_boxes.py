from PIL import Image
import os, glob

def get_row_bounds(img_path):
    img = Image.open(img_path).convert("RGBA")
    w, h = img.size
    row_h = h / 4.0
    col_w = w / 3.0

    print(f"=== {os.path.basename(img_path)} ({w}x{h}) ===")
    print(f"Calculated row height: {row_h}px, column width: {col_w}px")

    for row in range(4):
        min_y, max_y = h, 0
        min_x, max_x = w, 0
        for y in range(int(row * row_h), int((row + 1) * row_h)):
            for x in range(w):
                r, g, b, a = img.getpixel((x, y))
                if a > 20: # Non-transparent pixel
                    if y < min_y: min_y = y
                    if y > max_y: max_y = y
                    if x < min_x: min_x = x
                    if x > max_x: max_x = x

        rel_min_y = min_y - (row * row_h)
        rel_max_y = max_y - (row * row_h)
        print(f"  Row {row} ({['UP', 'DOWN', 'LEFT', 'RIGHT'][row]}): Y bounds [{min_y} - {max_y}] (rel: {rel_min_y:.1f} - {rel_max_y:.1f}), H: {max_y - min_y}px")

analyze_files = [
    "/Users/jilles/Thrivehaven/public/images/character/sprites/count.png",
    "/Users/jilles/Thrivehaven/public/images/character/sprites/squire.png",
    "/Users/jilles/Thrivehaven/public/images/character/sprites/knight.png",
    "/Users/jilles/Thrivehaven/public/images/character/sprites/king.png"
]

for f in analyze_files:
    if os.path.exists(f):
        get_row_bounds(f)
