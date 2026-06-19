import os
from supabase import create_client

supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(supabase_url, supabase_key)

res = supabase.table("inventory_items").select("*").limit(20).execute()
for item in res.data:
    print(f"{item['item_id']}: equipped={item.get('equipped')}")
