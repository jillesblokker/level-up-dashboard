from PIL import Image
import os, glob

def compress_heavy_image(file_path):
    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if size_mb < 0.5: # Skip files smaller than 500KB
        return

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in ['.png', '.jpg', '.jpeg']:
        return

    try:
        img = Image.open(file_path)
        # Convert RGBA to RGB if saving as JPG, but for WebP RGBA is supported
        webp_path = os.path.splitext(file_path)[0] + '.webp'

        img.save(webp_path, 'WEBP', quality=80, optimize=True)
        new_size_mb = os.path.getsize(webp_path) / (1024 * 1024)

        print(f"Compressed: {os.path.basename(file_path)} ({size_mb:.2f} MB ➡️ {new_size_mb:.2f} MB) - {(1 - new_size_mb/size_mb)*100:.1f}% savings")
    except Exception as e:
        print(f"Error compressing {file_path}: {e}")

print("=== STARTING HEAVY IMAGE COMPRESSION ===")
files = glob.glob("public/images/**/*.*", recursive=True)
for f in files:
    if os.path.isfile(f) and not f.endswith(".DS_Store"):
        compress_heavy_image(f)

print("=== COMPRESSION COMPLETE ===")
