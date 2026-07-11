package ru.wibestyle.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminStatisticsService {
    private static final TypeReference<Map<String, Object>> JSON_MAP = new TypeReference<>() {};
    private static final List<ScreenDefinition> KNOWN_SCREENS = List.of(
            new ScreenDefinition("web:/", "Web: старт"),
            new ScreenDefinition("web:/welcome", "Web: welcome"),
            new ScreenDefinition("web:/auth", "Web: вход"),
            new ScreenDefinition("web:/onboarding/avatar", "Web: аватар"),
            new ScreenDefinition("web:/home", "Web: главная"),
            new ScreenDefinition("web:/try-on", "Web: примерка"),
            new ScreenDefinition("web:/try-on/link", "Web: примерка по ссылке"),
            new ScreenDefinition("web:/try-on/photo", "Web: примерка по фото"),
            new ScreenDefinition("web:/try-on/result/[id]", "Web: результат"),
            new ScreenDefinition("web:/gallery", "Web: галерея"),
            new ScreenDefinition("web:/favorites", "Web: избранное"),
            new ScreenDefinition("web:/settings", "Web: настройки"),
            new ScreenDefinition("web:/paywall", "Web: тарифы"),
            new ScreenDefinition("mobile:/welcome", "Mobile: welcome"),
            new ScreenDefinition("mobile:/auth", "Mobile: вход"),
            new ScreenDefinition("mobile:/onboarding/avatar", "Mobile: аватар"),
            new ScreenDefinition("mobile:/(main)/home", "Mobile: главная"),
            new ScreenDefinition("mobile:/(main)/try-on", "Mobile: примерка"),
            new ScreenDefinition("mobile:/try-on/link", "Mobile: примерка по ссылке"),
            new ScreenDefinition("mobile:/try-on/photo", "Mobile: примерка по фото"),
            new ScreenDefinition("mobile:/try-on/result/[id]", "Mobile: результат"),
            new ScreenDefinition("mobile:/(main)/gallery", "Mobile: галерея"),
            new ScreenDefinition("mobile:/favorites", "Mobile: избранное"),
            new ScreenDefinition("mobile:/settings", "Mobile: настройки"),
            new ScreenDefinition("mobile:/paywall", "Mobile: тарифы"),
            new ScreenDefinition("mobile:/referrals", "Mobile: рефералка")
    );

    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;

    public AdminStatisticsService(EntityManager entityManager, ObjectMapper objectMapper) {
        this.entityManager = entityManager;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> dashboard() {
        Instant now = Instant.now();
        Instant dayAgo = now.minus(1, ChronoUnit.DAYS);
        Instant weekAgo = now.minus(7, ChronoUnit.DAYS);
        Instant monthAgo = now.minus(30, ChronoUnit.DAYS);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalRegistrations", scalarLong("SELECT COUNT(*) FROM users"));
        summary.put("registrationsToday", scalarLong("SELECT COUNT(*) FROM users WHERE created_at >= :from", Map.of("from", dayAgo)));
        summary.put("registrations7d", scalarLong("SELECT COUNT(*) FROM users WHERE created_at >= :from", Map.of("from", weekAgo)));
        summary.put("registrations30d", scalarLong("SELECT COUNT(*) FROM users WHERE created_at >= :from", Map.of("from", monthAgo)));
        summary.put("activeUsers24h", scalarLong("""
                SELECT COUNT(DISTINCT user_id)
                FROM marketing_events
                WHERE user_id IS NOT NULL
                  AND event_type IN ('app_opened', 'screen_view')
                  AND created_at >= :from
                """, Map.of("from", dayAgo)));
        summary.put("activeUsers7d", scalarLong("""
                SELECT COUNT(DISTINCT user_id)
                FROM marketing_events
                WHERE user_id IS NOT NULL
                  AND event_type IN ('app_opened', 'screen_view')
                  AND created_at >= :from
                """, Map.of("from", weekAgo)));
        summary.put("trialExhaustedNoPurchase", scalarLong("""
                SELECT COUNT(*)
                FROM user_profiles up
                WHERE up.plan = 'trial'
                  AND up.trial_generations_left <= 0
                  AND NOT EXISTS (
                    SELECT 1 FROM billing_checkouts bc
                    WHERE bc.user_id = up.user_id AND bc.status = 'completed'
                  )
                """));
        summary.put("paidUsers", scalarLong("SELECT COUNT(DISTINCT user_id) FROM billing_checkouts WHERE status = 'completed'"));
        summary.put("completedPayments", scalarLong("SELECT COUNT(*) FROM billing_checkouts WHERE status = 'completed'"));
        summary.put("revenueRub", scalarLong("SELECT COALESCE(SUM(price_rub), 0) FROM billing_checkouts WHERE status = 'completed'"));
        summary.put("telegramClicks", scalarLong("SELECT COUNT(*) FROM marketing_events WHERE event_type = 'telegram_channel_click'"));

        return Map.of(
                "summary", summary,
                "subscriptions", subscriptions(),
                "trialExhaustedUsers", trialExhaustedUsers(),
                "activeUsers", activeUsers(dayAgo),
                "screens", screens(),
                "telegramClicks", telegramClicks(),
                "referrals", referrals()
        );
    }

    private List<Map<String, Object>> subscriptions() {
        return rows("""
                SELECT plan, billing_period, checkout_type, COUNT(*), COUNT(DISTINCT user_id), COALESCE(SUM(price_rub), 0)
                FROM billing_checkouts
                WHERE status = 'completed'
                GROUP BY plan, billing_period, checkout_type
                ORDER BY COUNT(*) DESC, COALESCE(SUM(price_rub), 0) DESC
                """).stream().map(row -> mapOf(
                "plan", valueOr(row[0], "unknown"),
                "period", valueOr(row[1], "unknown"),
                "checkoutType", valueOr(row[2], "initial"),
                "purchases", longValue(row[3]),
                "buyers", longValue(row[4]),
                "revenueRub", longValue(row[5])
        )).toList();
    }

    private List<Map<String, Object>> trialExhaustedUsers() {
        return rows("""
                SELECT u.id, COALESCE(NULLIF(up.display_name, ''), u.phone, u.email, u.login, CAST(u.id AS VARCHAR)),
                       u.phone, u.email, u.created_at, up.trial_generations_left, up.bonus_generations_left,
                       COALESCE(MAX(me.created_at), u.created_at) AS last_activity
                FROM user_profiles up
                JOIN users u ON u.id = up.user_id
                LEFT JOIN marketing_events me ON me.user_id = u.id
                WHERE up.plan = 'trial'
                  AND up.trial_generations_left <= 0
                  AND NOT EXISTS (
                    SELECT 1 FROM billing_checkouts bc
                    WHERE bc.user_id = u.id AND bc.status = 'completed'
                  )
                GROUP BY u.id, up.display_name, u.phone, u.email, u.login, u.created_at,
                         up.trial_generations_left, up.bonus_generations_left
                ORDER BY last_activity DESC
                LIMIT 100
                """).stream().map(row -> mapOf(
                "userId", row[0].toString(),
                "label", valueOr(row[1], ""),
                "phone", valueOr(row[2], ""),
                "email", valueOr(row[3], ""),
                "createdAt", row[4].toString(),
                "trialGenerationsLeft", longValue(row[5]),
                "bonusGenerationsLeft", longValue(row[6]),
                "lastActivityAt", row[7].toString()
        )).toList();
    }

    private List<Map<String, Object>> activeUsers(Instant since) {
        return rows("""
                SELECT u.id, COALESCE(NULLIF(up.display_name, ''), u.phone, u.email, u.login, CAST(u.id AS VARCHAR)),
                       u.phone, u.email, up.plan, up.trial_generations_left, MAX(me.created_at), COUNT(*)
                FROM marketing_events me
                JOIN users u ON u.id = me.user_id
                LEFT JOIN user_profiles up ON up.user_id = u.id
                WHERE me.event_type IN ('app_opened', 'screen_view')
                  AND me.created_at >= :since
                GROUP BY u.id, up.display_name, u.phone, u.email, u.login, up.plan, up.trial_generations_left
                ORDER BY MAX(me.created_at) DESC
                LIMIT 100
                """, Map.of("since", since)).stream().map(row -> mapOf(
                "userId", row[0].toString(),
                "label", valueOr(row[1], ""),
                "phone", valueOr(row[2], ""),
                "email", valueOr(row[3], ""),
                "plan", valueOr(row[4], ""),
                "trialGenerationsLeft", longValue(row[5]),
                "lastActivityAt", row[6].toString(),
                "events24h", longValue(row[7])
        )).toList();
    }

    private List<Map<String, Object>> screens() {
        Map<String, ScreenStat> stats = new LinkedHashMap<>();
        for (ScreenDefinition screen : KNOWN_SCREENS) {
            stats.put(screen.key(), new ScreenStat(screen.key(), screen.label()));
        }
        for (Object[] row : rows("""
                SELECT metadata_json, user_id
                FROM marketing_events
                WHERE event_type = 'screen_view'
                ORDER BY created_at DESC
                LIMIT 10000
                """)) {
            Map<String, Object> metadata = parseMetadata(row[0]);
            String platform = stringValue(metadata.get("platform"));
            String screen = normalizeScreen(stringValue(metadata.get("screen")));
            if (screen.isBlank()) continue;
            String key = (platform.isBlank() ? "unknown" : platform) + ":" + screen;
            ScreenStat stat = stats.computeIfAbsent(key, ignored -> new ScreenStat(key, key));
            stat.views++;
            if (row[1] != null) stat.users.put(row[1].toString(), Boolean.TRUE);
        }
        return stats.values().stream()
                .sorted(Comparator.comparingLong(ScreenStat::views).reversed().thenComparing(ScreenStat::label))
                .map(stat -> mapOf(
                        "key", stat.key,
                        "label", stat.label,
                        "views", stat.views,
                        "users", stat.users.size(),
                        "visited", stat.views > 0
                ))
                .toList();
    }

    private List<Map<String, Object>> telegramClicks() {
        return rows("""
                SELECT u.id, COALESCE(NULLIF(up.display_name, ''), u.phone, u.email, u.login, CAST(u.id AS VARCHAR)),
                       u.phone, u.email, COUNT(*), MAX(me.created_at)
                FROM marketing_events me
                JOIN users u ON u.id = me.user_id
                LEFT JOIN user_profiles up ON up.user_id = u.id
                WHERE me.event_type = 'telegram_channel_click'
                GROUP BY u.id, up.display_name, u.phone, u.email, u.login
                ORDER BY MAX(me.created_at) DESC
                LIMIT 100
                """).stream().map(row -> mapOf(
                "userId", row[0].toString(),
                "label", valueOr(row[1], ""),
                "phone", valueOr(row[2], ""),
                "email", valueOr(row[3], ""),
                "clicks", longValue(row[4]),
                "lastClickedAt", row[5].toString()
        )).toList();
    }

    private Map<String, Object> referrals() {
        List<Map<String, Object>> leaders = rows("""
                SELECT referrer.id,
                       COALESCE(NULLIF(referrer_profile.display_name, ''), referrer.phone, referrer.email, referrer.login, CAST(referrer.id AS VARCHAR)),
                       referrer_account.referral_code,
                       COUNT(invitee.user_id) AS invites,
                       SUM(CASE WHEN invitee.first_paid_at IS NULL THEN 0 ELSE 1 END) AS purchases,
                       (SELECT COUNT(*) FROM referral_rewards rw WHERE rw.referrer_user_id = referrer.id) AS rewards,
                       (SELECT COALESCE(SUM(rw.reward_generations), 0) FROM referral_rewards rw WHERE rw.referrer_user_id = referrer.id) AS reward_generations,
                       MAX(invitee.referred_at) AS last_referred_at
                FROM referral_accounts referrer_account
                JOIN users referrer ON referrer.id = referrer_account.user_id
                LEFT JOIN user_profiles referrer_profile ON referrer_profile.user_id = referrer.id
                LEFT JOIN referral_accounts invitee ON invitee.referred_by_user_id = referrer.id
                WHERE invitee.user_id IS NOT NULL
                GROUP BY referrer.id, referrer_profile.display_name, referrer.phone, referrer.email,
                         referrer.login, referrer_account.referral_code
                ORDER BY COUNT(invitee.user_id) DESC, SUM(CASE WHEN invitee.first_paid_at IS NULL THEN 0 ELSE 1 END) DESC
                LIMIT 50
                """).stream().map(row -> mapOf(
                "userId", row[0].toString(),
                "label", valueOr(row[1], ""),
                "referralCode", valueOr(row[2], ""),
                "invites", longValue(row[3]),
                "purchases", longValue(row[4]),
                "rewards", longValue(row[5]),
                "rewardGenerations", longValue(row[6]),
                "lastReferredAt", row[7] == null ? "" : row[7].toString()
        )).toList();
        return Map.of(
                "summary", mapOf(
                        "invites", scalarLong("SELECT COUNT(*) FROM referral_accounts WHERE referred_by_user_id IS NOT NULL"),
                        "purchases", scalarLong("SELECT COUNT(*) FROM referral_accounts WHERE referred_by_user_id IS NOT NULL AND first_paid_at IS NOT NULL"),
                        "rewarded", scalarLong("SELECT COUNT(*) FROM referral_rewards"),
                        "generationsAwarded", scalarLong("SELECT COALESCE(SUM(reward_generations), 0) FROM referral_rewards")
                ),
                "leaders", leaders
        );
    }

    private long scalarLong(String sql) {
        return scalarLong(sql, Map.of());
    }

    private long scalarLong(String sql, Map<String, Object> params) {
        Object value = query(sql, params).getSingleResult();
        return longValue(value);
    }

    private List<Object[]> rows(String sql) {
        return rows(sql, Map.of());
    }

    private List<Object[]> rows(String sql, Map<String, Object> params) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = query(sql, params).getResultList();
        return rows;
    }

    private Query query(String sql, Map<String, Object> params) {
        Query query = entityManager.createNativeQuery(sql);
        params.forEach(query::setParameter);
        return query;
    }

    private Map<String, Object> parseMetadata(Object value) {
        if (value == null) return Map.of();
        try {
            return objectMapper.readValue(value.toString(), JSON_MAP);
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private static Map<String, Object> mapOf(Object... values) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i + 1 < values.length; i += 2) {
            map.put(values[i].toString(), values[i + 1]);
        }
        return map;
    }

    private static long longValue(Object value) {
        if (value == null) return 0;
        if (value instanceof BigDecimal decimal) return decimal.longValue();
        if (value instanceof Number number) return number.longValue();
        return Long.parseLong(value.toString());
    }

    private static String valueOr(Object value, String fallback) {
        return value == null ? fallback : value.toString();
    }

    private static String stringValue(Object value) {
        return value == null ? "" : value.toString().trim();
    }

    private static String normalizeScreen(String screen) {
        return screen.replaceAll("/[0-9a-fA-F]{8}-[0-9a-fA-F-]{27,}", "/[id]")
                .replaceAll("/[0-9a-zA-Z_-]{16,}$", "/[id]");
    }

    private record ScreenDefinition(String key, String label) {}

    private static class ScreenStat {
        final String key;
        final String label;
        long views;
        final Map<String, Boolean> users = new LinkedHashMap<>();

        ScreenStat(String key, String label) {
            this.key = key;
            this.label = label;
        }

        long views() {
            return views;
        }

        String label() {
            return label;
        }
    }
}
