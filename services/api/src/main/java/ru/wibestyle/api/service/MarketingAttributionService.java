package ru.wibestyle.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.config.MarketingProperties;
import ru.wibestyle.api.domain.MarketingChannelEntity;
import ru.wibestyle.api.domain.MarketingEventEntity;
import ru.wibestyle.api.domain.MarketingVisitEntity;
import ru.wibestyle.api.domain.UserEntity;
import ru.wibestyle.api.dto.MarketingChannelRequest;
import ru.wibestyle.api.dto.MarketingEventRequest;
import ru.wibestyle.api.dto.MarketingTouchRequest;
import ru.wibestyle.api.dto.MarketingVisitRequest;
import ru.wibestyle.api.repository.MarketingChannelRepository;
import ru.wibestyle.api.repository.MarketingEventRepository;
import ru.wibestyle.api.repository.MarketingVisitRepository;
import ru.wibestyle.api.repository.UserRepository;
import ru.wibestyle.api.support.RequestSupport;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class MarketingAttributionService {
    private static final Set<String> EVENT_TYPES = Set.of(
            "landing_visit", "cta_click", "app_opened", "signup_started",
            "signup_completed", "login_completed", "payment_started", "payment_completed"
    );

    private final MarketingVisitRepository visitRepository;
    private final MarketingEventRepository eventRepository;
    private final MarketingChannelRepository channelRepository;
    private final UserRepository userRepository;
    private final MarketingProperties properties;
    private final ObjectMapper objectMapper;
    private final EntityManager entityManager;

    public MarketingAttributionService(MarketingVisitRepository visitRepository,
                                       MarketingEventRepository eventRepository,
                                       MarketingChannelRepository channelRepository,
                                       UserRepository userRepository,
                                       MarketingProperties properties,
                                       ObjectMapper objectMapper,
                                       EntityManager entityManager) {
        this.visitRepository = visitRepository;
        this.eventRepository = eventRepository;
        this.channelRepository = channelRepository;
        this.userRepository = userRepository;
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.entityManager = entityManager;
    }

    @Transactional
    public MarketingVisitEntity recordVisit(MarketingVisitRequest request, HttpServletRequest httpRequest) {
        boolean firstVisit = visitRepository.findFirstByVisitorIdOrderByCreatedAtAsc(request.visitorId()).isEmpty();
        MarketingTouchRequest touch = firstVisit && request.firstTouch() != null ? request.firstTouch() : request.lastTouch();
        if (touch == null) touch = request.firstTouch();
        if (touch == null) touch = new MarketingTouchRequest(null, null, null, null, null, null, null, null, null, null, null, null);

        String source = clean(touch.utmSource(), 100);
        String medium = clean(touch.utmMedium(), 100);
        if (source == null) {
            if (clean(touch.referrer(), 2000) == null) {
                source = "direct";
                medium = "none";
            } else {
                source = "referral";
                medium = "unknown";
            }
        }
        UUID channelId = channelRepository
                .findFirstByUtmSourceIgnoreCaseAndUtmMediumIgnoreCaseAndEnabledTrue(source, medium == null ? "" : medium)
                .map(MarketingChannelEntity::getId).orElse(null);
        Instant clientTime = request.createdAt();
        if (clientTime != null && (clientTime.isBefore(Instant.now().minusSeconds(31_536_000L))
                || clientTime.isAfter(Instant.now().plusSeconds(86_400)))) clientTime = null;

        MarketingVisitEntity visit = new MarketingVisitEntity(
                UUID.randomUUID(), request.visitorId(), channelId, source, medium,
                clean(touch.utmCampaign(), 200), clean(touch.utmContent(), 300), clean(touch.utmTerm(), 300),
                clean(touch.yclid(), 300), clean(touch.ysclid(), 300), clean(touch.gclid(), 300),
                clean(touch.fbclid(), 300), clean(touch.vkClickId(), 300), clean(touch.landingUrl(), 2000),
                clean(touch.referrer(), 2000), hash(RequestSupport.clientIp(httpRequest)),
                hash(httpRequest.getHeader("User-Agent")), clientTime, Instant.now()
        );
        visitRepository.save(visit);
        recordEventInternal(request.visitorId(), null, "landing_visit", Map.of("visitId", visit.getId().toString()));
        return visit;
    }

    @Transactional
    public void recordEvent(MarketingEventRequest request, UUID userId) {
        recordEventInternal(clean(request.visitorId(), 64), userId, request.eventType(), request.metadata());
    }

    @Transactional
    public void recordSystemEvent(String visitorId, UUID userId, String eventType, Map<String, Object> metadata) {
        recordEventInternal(clean(visitorId, 64), userId, eventType, metadata);
    }

    private void recordEventInternal(String visitorId, UUID userId, String eventType, Map<String, Object> metadata) {
        String normalizedType = eventType == null ? "" : eventType.trim().toLowerCase(Locale.ROOT);
        if (!EVENT_TYPES.contains(normalizedType)) throw new IllegalArgumentException("MARKETING_EVENT_INVALID");
        String json = null;
        if (metadata != null && !metadata.isEmpty()) {
            try {
                json = objectMapper.writeValueAsString(metadata);
            } catch (JsonProcessingException ex) {
                throw new IllegalArgumentException("MARKETING_METADATA_INVALID", ex);
            }
            if (json.length() > 4000) throw new IllegalArgumentException("MARKETING_METADATA_TOO_LARGE");
        }
        eventRepository.save(new MarketingEventEntity(UUID.randomUUID(), visitorId, userId, normalizedType, json, Instant.now()));
    }

    @Transactional
    public void attachUserToVisitor(UUID userId, String visitorId, boolean newUser) {
        String normalized = clean(visitorId, 64);
        if (normalized == null) return;
        MarketingVisitEntity first = visitRepository.findFirstByVisitorIdOrderByCreatedAtAsc(normalized).orElse(null);
        MarketingVisitEntity last = visitRepository.findFirstByVisitorIdOrderByCreatedAtDesc(normalized).orElse(null);
        if (first == null) return;
        UserEntity user = userRepository.findById(userId).orElseThrow();
        user.attachMarketing(normalized, first.getId(), last == null ? first.getId() : last.getId());
        userRepository.save(user);
        recordEventInternal(normalized, userId, newUser ? "signup_completed" : "login_completed", Map.of());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> adminStats(Instant from, Instant to, String source, String medium,
                                          String campaign, boolean detailed) {
        String contentFields = detailed ? ", mv.utm_content, mv.utm_term" : "";
        String contentGroup = detailed ? ", mv.utm_content, mv.utm_term" : "";
        StringBuilder sql = new StringBuilder("""
                SELECT mv.utm_source, mv.utm_medium, mv.utm_campaign, mc.display_name
                """).append(contentFields).append("""
                , COUNT(DISTINCT mv.id) AS visits,
                  COUNT(DISTINCT u.id) AS registrations,
                  COUNT(DISTINCT bc.id) AS payments
                FROM marketing_visits mv
                LEFT JOIN marketing_channels mc
                  ON mc.utm_source = mv.utm_source AND mc.utm_medium = mv.utm_medium AND mc.enabled = TRUE
                LEFT JOIN users u ON u.first_marketing_visit_id = mv.id
                LEFT JOIN billing_checkouts bc ON bc.user_id = u.id AND bc.status = 'completed'
                WHERE 1=1
                """);
        if (from != null) sql.append(" AND mv.created_at >= :from");
        if (to != null) sql.append(" AND mv.created_at < :to");
        if (clean(source, 100) != null) sql.append(" AND mv.utm_source = :source");
        if (clean(medium, 100) != null) sql.append(" AND mv.utm_medium = :medium");
        if (clean(campaign, 200) != null) sql.append(" AND mv.utm_campaign = :campaign");
        sql.append(" GROUP BY mv.utm_source, mv.utm_medium, mv.utm_campaign, mc.display_name").append(contentGroup)
                .append(" ORDER BY visits DESC");
        Query query = entityManager.createNativeQuery(sql.toString());
        if (from != null) query.setParameter("from", from);
        if (to != null) query.setParameter("to", to);
        if (clean(source, 100) != null) query.setParameter("source", clean(source, 100));
        if (clean(medium, 100) != null) query.setParameter("medium", clean(medium, 100));
        if (clean(campaign, 200) != null) query.setParameter("campaign", clean(campaign, 200));
        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<Map<String, Object>> items = rows.stream().map(row -> {
            int offset = detailed ? 6 : 4;
            long visits = ((Number) row[offset]).longValue();
            long registrations = ((Number) row[offset + 1]).longValue();
            long payments = ((Number) row[offset + 2]).longValue();
            var item = new java.util.LinkedHashMap<String, Object>();
            item.put("source", row[0] == null ? "direct" : row[0]);
            item.put("medium", row[1] == null ? "none" : row[1]);
            item.put("campaign", row[2] == null ? "" : row[2]);
            item.put("channelName", row[3] == null ? "" : row[3]);
            if (detailed) {
                item.put("content", row[4] == null ? "" : row[4]);
                item.put("term", row[5] == null ? "" : row[5]);
            }
            item.put("visits", visits);
            item.put("registrations", registrations);
            item.put("registrationConversion", percentage(registrations, visits));
            item.put("payments", payments);
            item.put("paymentConversion", percentage(payments, visits));
            return Map.copyOf(item);
        }).toList();
        return Map.of("items", items);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> adminRegistrations() {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                SELECT u.id, u.created_at,
                       first_visit.utm_source, first_visit.utm_medium, first_visit.utm_campaign,
                       last_visit.utm_source, last_visit.utm_medium, last_visit.utm_campaign
                FROM users u
                JOIN marketing_visits first_visit ON first_visit.id = u.first_marketing_visit_id
                JOIN marketing_visits last_visit ON last_visit.id = u.last_marketing_visit_id
                ORDER BY u.created_at DESC
                LIMIT 200
                """).getResultList();
        List<Map<String, Object>> items = rows.stream().map(row -> {
            var item = new java.util.LinkedHashMap<String, Object>();
            item.put("userId", row[0].toString());
            item.put("registeredAt", row[1].toString());
            item.put("firstSource", valueOr(row[2], "direct"));
            item.put("firstMedium", valueOr(row[3], "none"));
            item.put("firstCampaign", valueOr(row[4], ""));
            item.put("lastSource", valueOr(row[5], "direct"));
            item.put("lastMedium", valueOr(row[6], "none"));
            item.put("lastCampaign", valueOr(row[7], ""));
            return Map.copyOf(item);
        }).toList();
        return Map.of("items", items);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> channels() {
        return channelRepository.findAllByOrderByDisplayNameAsc().stream().map(this::channelMap).toList();
    }

    @Transactional
    public Map<String, Object> createChannel(MarketingChannelRequest request) {
        if (channelRepository.findByCodeIgnoreCase(request.code()).isPresent()) {
            throw new IllegalArgumentException("MARKETING_CHANNEL_CODE_EXISTS");
        }
        Instant now = Instant.now();
        MarketingChannelEntity channel = new MarketingChannelEntity(UUID.randomUUID(), request.code(),
                request.displayName().trim(), nullableLower(request.utmSource()), nullableLower(request.utmMedium()),
                clean(request.description(), 500), request.enabled(), now);
        return channelMap(channelRepository.save(channel));
    }

    @Transactional
    public Map<String, Object> updateChannel(UUID id, MarketingChannelRequest request) {
        MarketingChannelEntity channel = channelRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("MARKETING_CHANNEL_NOT_FOUND"));
        channelRepository.findByCodeIgnoreCase(request.code())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> { throw new IllegalArgumentException("MARKETING_CHANNEL_CODE_EXISTS"); });
        channel.update(request.code(), request.displayName().trim(), nullableLower(request.utmSource()),
                nullableLower(request.utmMedium()), clean(request.description(), 500), request.enabled(), Instant.now());
        return channelMap(channelRepository.save(channel));
    }

    private Map<String, Object> channelMap(MarketingChannelEntity channel) {
        var result = new java.util.LinkedHashMap<String, Object>();
        result.put("id", channel.getId().toString());
        result.put("code", channel.getCode());
        result.put("displayName", channel.getDisplayName());
        result.put("utmSource", channel.getUtmSource() == null ? "" : channel.getUtmSource());
        result.put("utmMedium", channel.getUtmMedium() == null ? "" : channel.getUtmMedium());
        result.put("description", channel.getDescription() == null ? "" : channel.getDescription());
        result.put("enabled", channel.isEnabled());
        result.put("updatedAt", channel.getUpdatedAt().toString());
        return Map.copyOf(result);
    }

    private static double percentage(long value, long total) {
        if (total == 0) return 0;
        return BigDecimal.valueOf(value * 100.0 / total).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private static Object valueOr(Object value, String fallback) {
        return value == null ? fallback : value;
    }

    private String hash(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return java.util.HexFormat.of().formatHex(digest.digest(
                    (properties.getHashSalt() + "|" + value).getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    private static String nullableLower(String value) {
        String cleaned = clean(value, 100);
        return cleaned == null ? null : cleaned.toLowerCase(Locale.ROOT);
    }

    private static String clean(String value, int max) {
        if (value == null) return null;
        String cleaned = value.trim();
        if (cleaned.isEmpty()) return null;
        return cleaned.length() <= max ? cleaned : cleaned.substring(0, max);
    }
}
