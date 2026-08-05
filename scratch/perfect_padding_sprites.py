from PIL import Image
import os, glob

def perfect_pad_spritesheet(img_path):
    img = Image.open(img_path).convert("RGBA")
    w, h = img.size
    cell_w = w / 3.0
    cell_h = h / 4.0

    padded = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    for row in range(4):
        for col in range(3):
            # Crop current cell
            box = (int(col * cell_w), int(row * cell_h), int((col + 1) * cell_w), int((row + 1) * cell_h))
            cell = img.crop(box)

            # Find bounding box of character pixels
            bbox = cell.getbbox()
            if not bbox:
                continue

            char_w = bbox[2] - bbox[0]
            char_h = bbox[3] - bbox[1]

            char_crop = cell.crop(bbox)

            # Max allowed character height inside 236px cell with 24px top & bottom padding is 188px
            max_allowed_h = int(cell_h - 48) # 24px top, 24px bottom padding
            max_allowed_w = int(cell_w - 48) # 24px left, 24px right padding

            scale_factor = 1.0
            if char_h > max_allowed_h or char_w > max_allowed_w:
                scale_factor = min(max_allowed_h / char_h, max_allowed_w / char_w)
                new_w = max(1, int(char_w * scale_factor))
                new_h = max(1, int(char_h * scale_factor))
                char_crop = char_crop.resize((new_w, new_h), Image.Resampling.LANCZOS)
                char_w, char_h = new_w, new_h

            # Center horizontally and vertically within the inner safe zone (24px margins)
            target_x = int((cell_w - char_w) / 2.0)
            target_y = int((cell_h - char_h) / 2.0)

            dest_x = int(col * cell_w) + target_x
            dest_y = int(row * cell_h) + target_y

            padded.paste(char_crop, (dest_x, dest_y), char_crop)

    padded.save(img_path, "PNG")
    print(f"Perfectly padded & centered {os.path.basename(img_path)}")

sprite_dir = "/Users/jilles/Thrivehaven/public/images/character/sprites"
for f in glob.glob(os.path.join(sprite_dir, "*.png")):
    perfect_pad_spritesheet(f)
