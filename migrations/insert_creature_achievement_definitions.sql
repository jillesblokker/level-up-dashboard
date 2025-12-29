INSERT INTO achievement_definitions (
        id,
        name,
        description,
        xp_reward,
        gold_reward,
        unlock_condition
    )
VALUES (
        '001',
        'Flamio',
        'A fiery creature awakened by any forest destruction.',
        100,
        50,
        'Destroy 1 Forest'
    ),
    (
        '002',
        'Embera',
        'A more powerful fire entity born from continued forest destruction.',
        200,
        100,
        'Destroy 5 Forests'
    ),
    (
        '003',
        'Vulcana',
        'The ultimate fire creature, master of forest destruction.',
        500,
        250,
        'Destroy 10 Forests'
    ),
    (
        '004',
        'Dolphio',
        'A playful water creature that appears when expanding water territories.',
        100,
        50,
        'Place 1 Water'
    ),
    (
        '005',
        'Divero',
        'A more experienced water dweller, guardian of expanding waters.',
        200,
        100,
        'Place 5 Water'
    ),
    (
        '006',
        'Flippur',
        'The supreme water creature, master of vast water territories.',
        500,
        250,
        'Place 10 Water'
    ),
    (
        '007',
        'Leaf',
        'A small grass creature that appears when planting new forests.',
        100,
        50,
        'Place 1 Forest'
    ),
    (
        '008',
        'Oaky',
        'A stronger forest guardian, protector of growing woodlands.',
        200,
        100,
        'Place 5 Forest'
    ),
    (
        '009',
        'Seqoio',
        'The mighty forest spirit, overseer of vast woodlands.',
        500,
        250,
        'Place 10 Forest'
    ),
    (
        '010',
        'Rockie',
        'A small rock creature that emerges from destroyed mountains.',
        100,
        50,
        'Destroy 1 Mountain'
    ),
    (
        '011',
        'Buldour',
        'A stronger mountain spirit, born from continued destruction.',
        200,
        100,
        'Destroy 5 Mountains'
    ),
    (
        '012',
        'Montano',
        'The ultimate mountain creature, master of destroyed peaks.',
        500,
        250,
        'Destroy 10 Mountains'
    ),
    (
        '013',
        'IceCube',
        'A small ice creature born from placing ice tiles.',
        100,
        50,
        'Place 1 Ice'
    ),
    (
        '014',
        'Iciclo',
        'A sharp ice spirit responding to expanded frozen lands.',
        200,
        100,
        'Place 5 Ice'
    ),
    (
        '015',
        'Glacior',
        'The ruler of the frozen wastes, master of ice placement.',
        500,
        250,
        'Place 10 Ice'
    ) ON CONFLICT (id) DO
UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    xp_reward = EXCLUDED.xp_reward,
    gold_reward = EXCLUDED.gold_reward,
    unlock_condition = EXCLUDED.unlock_condition;