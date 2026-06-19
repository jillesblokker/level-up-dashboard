import os
import urllib.request
import urllib.parse

def load_env():
    env = {}
    with open("/Users/jillesblokker/Downloads/level-up/.env") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                parts = line.split("=", 1)
                if len(parts) == 2:
                    env[parts[0].strip()] = parts[1].strip()
    return env

env = load_env()
supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL")
service_key = env.get("SUPABASE_SERVICE_ROLE_KEY")

url = f"{supabase_url}/rest/v1/inventory_items?select=*"
req = urllib.request.Request(
    url,
    headers={
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Range-Unit": "items",
        "Range": "0-10"
    }
)

with urllib.request.urlopen(req) as response:
    print(f"Status: {response.getcode()}")
    print("Body: " + response.read().decode("utf-8")[:500])
