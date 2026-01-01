-- Function to handle atomic market purchase
CREATE OR REPLACE FUNCTION purchase_market_listing(p_listing_id UUID, p_buyer_id TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_listing RECORD;
v_buyer_gold INTEGER;
v_item_data JSONB;
BEGIN -- 1. Fetch Listing & Lock it
SELECT * INTO v_listing
FROM market_listings
WHERE id = p_listing_id
    AND status = 'active' FOR
UPDATE;
-- Lock this row to prevent race conditions
IF NOT FOUND THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Listing not found or already sold'
);
END IF;
-- 2. Prevent buying own listing
IF v_listing.seller_id = p_buyer_id THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Cannot buy your own listing'
);
END IF;
-- 3. Check Buyer Gold
SELECT gold INTO v_buyer_gold
FROM character_stats
WHERE user_id = p_buyer_id;
IF v_buyer_gold IS NULL
OR v_buyer_gold < v_listing.price THEN RETURN jsonb_build_object('success', false, 'error', 'Insufficient gold');
END IF;
-- 4. Execute Transaction
-- Deduct Gold from Buyer
UPDATE character_stats
SET gold = gold - v_listing.price
WHERE user_id = p_buyer_id;
-- Add Gold to Seller
UPDATE character_stats
SET gold = gold + v_listing.price
WHERE user_id = v_listing.seller_id;
-- Transfer Item (Add to Buyer Inventory)
-- Assuming item_type = 'tile' for now.
-- We assume 'tile_inventory' has columns: user_id, tile_id, quantity
INSERT INTO tile_inventory (user_id, tile_id, quantity)
VALUES (
        p_buyer_id,
        v_listing.item_id,
        v_listing.quantity
    ) ON CONFLICT (user_id, tile_id) DO
UPDATE
SET quantity = tile_inventory.quantity + v_listing.quantity;
-- Mark Listing as Sold
UPDATE market_listings
SET status = 'sold',
    updated_at = NOW()
WHERE id = p_listing_id;
-- 5. Return Success
RETURN jsonb_build_object(
    'success',
    true,
    'message',
    'Purchase successful'
);
EXCEPTION
WHEN OTHERS THEN -- Rollback happens automatically on error
RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;