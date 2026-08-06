from PIL import Image
import os, glob

def overwrite_heavy_png(file_path):
    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if size_mb < 0.5: # Skip files smaller than 500KB
        return

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in ['.png', '.jpg', '.jpeg']:
        return

    try:
        img = Image.open(file_path)
        # Re-save in place with maximum PNG optimization & compression
        img.save(file_path, optimize=True)
        new_size_mb = os.path.getsize(file_path) / (1024 * 1024)

        print(f"Optimized in place: {os.path.basename(file_path)} ({size_mb:.2f} MB ➡️ {new_size_mb:.2f} MB)")
    except Exception as e:
        print(f"Error optimizing {file_path}: {e}")

print("=== STARTING IN-PLACE PNG OPTIMIZATION ===")
files = glob.glob("public/images/**/*.png", recursive=True)
for f in files:
    if os.path.isfile(f) and not f.endswith(".DS_Store"):
        # Skip character walking sprite sheets (since those have 24px padded frames)
        if "character/sprites" in f:
            continue
        overwrite_heavy_png(f)

print("=== IN-PLACE OPTIMIZATION COMPLETE ===")
