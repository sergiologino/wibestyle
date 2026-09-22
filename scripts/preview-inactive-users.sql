-- Read-only preview. No accounts or other data are changed.
-- Run against the production WibeStyle database and export the result.
-- All timestamp columns in the application are stored in UTC.
-- Missing user_activity is flagged: it is not proof that the user never returned.
WITH user_facts AS (
    SELECT
        u.id AS user_id,
        u.created_at AS registered_at_utc,
        ua.last_seen_at AS tracked_last_seen_at_utc,
        ua.last_try_on_at AS tracked_last_try_on_at_utc,
        ua.last_gallery_at AS tracked_last_gallery_at_utc,
        (SELECT MAX(d.last_seen_at) FROM user_device_links d WHERE d.user_id = u.id)
            AS last_device_login_at_utc,
        (SELECT MAX(t.created_at) FROM auth_refresh_tokens t WHERE t.user_id = u.id)
            AS last_token_issued_at_utc,
        (SELECT MAX(e.created_at) FROM marketing_events e WHERE e.user_id = u.id)
            AS last_recorded_event_at_utc,
        (SELECT COUNT(*) FROM avatars a WHERE a.user_id = u.id) AS avatar_records,
        (SELECT COUNT(*) FROM try_on_sessions s WHERE s.user_id = u.id) AS try_on_records,
        (SELECT COUNT(*) FROM stylist_sessions s WHERE s.user_id = u.id) AS stylist_records,
        (SELECT COUNT(*) FROM billing_checkouts b
            WHERE b.user_id = u.id AND b.status = 'completed') AS completed_payments,
        (SELECT COUNT(*) FROM billing_checkouts b
            WHERE b.user_id = u.id AND b.status = 'pending') AS pending_payments,
        (SELECT COUNT(*) FROM billing_subscriptions b WHERE b.user_id = u.id)
            AS subscription_records,
        (SELECT COUNT(*) FROM push_devices p WHERE p.user_id = u.id AND p.enabled = TRUE)
            AS enabled_push_devices,
        up.plan,
        up.plan_generations_left,
        up.bonus_generations_left,
        (ua.user_id IS NULL) AS activity_record_missing,
        CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AS checked_at_utc,
        (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') - INTERVAL '14 days' AS cutoff_utc
    FROM users u
    LEFT JOIN user_activity ua ON ua.user_id = u.id
    LEFT JOIN user_profiles up ON up.user_id = u.id
), activity AS (
    SELECT *,
        GREATEST(
            registered_at_utc,
            tracked_last_seen_at_utc,
            tracked_last_try_on_at_utc,
            tracked_last_gallery_at_utc,
            last_device_login_at_utc,
            last_token_issued_at_utc,
            last_recorded_event_at_utc
        ) AS last_known_activity_at_utc
    FROM user_facts
)
SELECT
    COUNT(*) OVER () AS preliminary_candidates_total,
    user_id,
    registered_at_utc,
    last_known_activity_at_utc,
    tracked_last_seen_at_utc,
    last_device_login_at_utc,
    last_token_issued_at_utc,
    last_recorded_event_at_utc,
    activity_record_missing,
    avatar_records,
    try_on_records,
    stylist_records,
    completed_payments,
    pending_payments,
    subscription_records,
    plan,
    plan_generations_left,
    bonus_generations_left,
    enabled_push_devices,
    checked_at_utc,
    cutoff_utc
FROM activity
WHERE avatar_records = 0
  AND try_on_records = 0
  AND stylist_records = 0
  AND tracked_last_try_on_at_utc IS NULL
  AND last_known_activity_at_utc < cutoff_utc
ORDER BY last_known_activity_at_utc, user_id;
