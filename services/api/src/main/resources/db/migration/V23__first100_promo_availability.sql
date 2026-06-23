INSERT INTO promo_codes (
    id,
    code,
    discount_percent,
    max_uses,
    uses_count,
    expires_at,
    label,
    created_at
)
SELECT
    '00000000-0000-0000-0000-000000023100',
    'FIRST100',
    50,
    100,
    29,
    TIMESTAMP '2035-12-31 23:59:59',
    'Первые 100 пользователей',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM promo_codes WHERE code = 'FIRST100'
);

-- The public counter starts at 71: 29 launch places are treated as already reserved.
-- Existing real usage above that baseline is never reduced.
UPDATE promo_codes
SET uses_count = 29
WHERE code = 'FIRST100'
  AND max_uses = 100
  AND uses_count < 29;
