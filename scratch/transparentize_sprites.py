from PIL import Image
import os

files = [
    "lion_novice_spritesheet.png",
    "lion_knight_spritesheet.png",
    "lion_guardian_spritesheet.png",
    "lion_king_spritesheet.png"
]

base_dir = "/Users/jilles/Thrivehaven/public/images/sprites"

for fname in files:
    fpath = os.path.join(base_dir, fname)
    if not os.path.exists(fpath):
        continue
    img = Image.open(fpath).convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        r, g, b, a = item
        # Detect grey/white checkerboard pixels (high brightness, low saturation)
        max_diff = max(abs(r - g), abs(r - b), abs(g - b))
        brightness = (r + g + b) / 3.0

        # If pixel is near grey/white background (brightness > 170 and color saturation < 30)
        if brightness > 175 and max_diff < 30:
            new_data.append((255, 255, 255, 0))  # Transparent
        elif brightness > 150 and max_diff < 15:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(fpath, "PNG")
    print(f"Transparentized {fname} successfully!")
