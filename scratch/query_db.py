import os
from supabase import create_client

# Let's read the env variables from .env or .env.local
# Let's search for env file
env_path = "/Users/jillesblokker/Downloads/level-up/.env.local"
if not os.path.exists(env_path):
    env_path = "/Users/jillesblokker/Downloads/level-up/.env"

supabase_url = None
supabase_service_key = None

if os.path.exists(env_path):
    with open(env_path, "r") as f:
        for line in f:
            if line.startswith("NEXT_PUBLIC_SUPABASE_URL="):
                supabase_url = line.split("=")[1].strip().strip('"').strip("'")
            elif line.startswith("SUPABASE_SERVICE_ROLE_KEY=") or line.startswith("SUPABASE_SERVICE_KEY="):
                supabase_service_key = line.split("=")[1].strip().strip('"').strip("'")

print("URL:", supabase_url)
print("Key exists:", supabase_service_key is not None)

if supabase_url and supabase_service_key:
    supabase = create_client(supabase_url, supabase_service_key)
    res = supabase.table("user_mythic_cards").select("*").limit(20).execute()
    print("Cards count in sample:", len(res.data))
    for row in res.data:
        print(row)
else:
    print("Could not find supabase credentials in env file")
