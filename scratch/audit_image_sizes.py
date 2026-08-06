import os, glob

print("=== HEAVIEST IMAGES IN PUBLIC/IMAGES ===")
files = glob.glob("public/images/**/*.*", recursive=True)
files_with_size = []
for f in files:
    if os.path.isfile(f) and not f.endswith(".DS_Store"):
        size_mb = os.path.getsize(f) / (1024 * 1024)
        files_with_size.append((f, size_mb))

files_with_size.sort(key=lambda x: x[1], reverse=True)
for f, size in files_with_size[:25]:
    print(f"{size:.2f} MB: {f}")
