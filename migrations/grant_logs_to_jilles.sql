-- Give 5 Logs to Jilles Blokker
DO $$
DECLARE target_user_id text;
BEGIN -- Attempt to find the user ID from auth.users
SELECT id INTO target_user_id
FROM auth.users
WHERE email = 'jillesblokker@gmail.com';
IF target_user_id IS NOT NULL THEN
INSERT INTO inventory_items (
        user_id,
        item_id,
        name,
        quantity,
        type,
        category,
        description,
        image,
        equipped
    )
VALUES (
        target_user_id,
        'material-logs',
        'Logs',
        5,
        'material',
        'material',
        'Wood logs for building.',
        '/images/items/materials/material-logs.png',
        false
    ) ON CONFLICT (user_id, item_id) DO
UPDATE
SET quantity = inventory_items.quantity + 5;
RAISE NOTICE 'Added 5 Logs to user %',
target_user_id;
ELSE RAISE NOTICE 'User jillesblokker@gmail.com not found in auth.users';
END IF;
END $$;