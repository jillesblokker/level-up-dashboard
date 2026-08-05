from PIL import Image
import os, glob

def normalize_spritesheet(img_path):
    img = Image.open(img_path).convert("RGBA")
    w, h = img.size
    cell_w = w / 3.0
    cell_h = h / 4.0

    normalized = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    for row in range(4):
        for col in range(3):
            # Crop current cell
            box = (int(col * cell_w), int(row * cell_h), int((col + 1) * cell_w), int((row + 1) * cell_h))
            cell = img.crop(box)

            # Find bounding box of non-transparent pixels in cell
            bbox = cell.getbbox()
            if not bbox:
                continue

            char_w = bbox[2] - bbox[0]
            char_h = bbox[3] - bbox[1]

            char_crop = cell.crop(bbox)

            # Target position inside 240x236 cell: centered horizontally, aligned near bottom with breathing room
            target_x = int((cell_w - char_w) / 2.0)
            target_y = int(cell_h - char_h - 12.0) # 12px bottom padding

            # Ensure top doesn't get clipped (minimum 8px top padding)
            if target_y < 8:
                target_y = 8

            # Paste into normalized cell
            dest_x = int(col * cell_w) + target_x
            dest_y = int(row * cell_h) + target_y

            normalized.paste(char_crop, (dest_x, dest_y), char_crop)

    normalized.save(img_path, "PNG")
    print(f"Successfully normalized & centered {os.path.basename(img_path)}")

sprite_dir = "/Users/jilles/Thrivehaven/public/images/character/sprites"
for f in glob.glob(os.path.join(sprite_dir, "*.png")):
    normalize_spritesheet(f)
