from PIL import Image
import os
import glob

def remove_background(img_path):
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    # Flood fill starting from edges
    visited = set()
    queue = []

    # Add all border pixels to queue
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    def is_bg_pixel(r, g, b):
        # Background is white/grey checkerboard: high brightness, low saturation
        max_diff = max(abs(r - g), abs(r - b), abs(g - b))
        brightness = (r + g + b) / 3.0
        return (brightness > 130 and max_diff < 35) or (brightness > 190)

    while queue:
        x, y = queue.pop()
        if (x, y) in visited:
            continue
        visited.add((x, y))

        r, g, b, a = pixels[x, y]
        if is_bg_pixel(r, g, b):
            pixels[x, y] = (0, 0, 0, 0)
            # Add 4-connected neighbors
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                    queue.append((nx, ny))

    img.save(img_path, "PNG")
    print(f"Successfully flood-filled transparentized {os.path.basename(img_path)}")

sprite_dir = "/Users/jilles/Thrivehaven/public/images/character/sprites"
for f in glob.glob(os.path.join(sprite_dir, "*.png")):
    remove_background(f)
