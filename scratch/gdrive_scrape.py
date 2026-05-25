import requests
import json
import re

url = "https://drive.google.com/drive/folders/1znQN9hbjMxuCTJdVVrzk02HEUM7aI_Cb"
headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
res = requests.get(url, headers=headers)
print("Status:", res.status_code)
# Search for files or json inside the response
html = res.text
print("Length:", len(html))

# Google Drive folder HTML pages contain JSON data in a script tag with key 'init' or 'bootstrap'
# Let's save the HTML to scratch/gdrive_page.html
with open("/Users/jillesblokker/Downloads/level-up/scratch/gdrive_page.html", "w") as f:
    f.write(html)
print("Saved to gdrive_page.html")
