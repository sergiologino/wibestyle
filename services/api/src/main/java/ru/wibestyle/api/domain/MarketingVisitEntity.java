package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "marketing_visits")
public class MarketingVisitEntity {
    @Id
    private UUID id;
    @Column(name = "visitor_id", nullable = false, length = 64)
    private String visitorId;
    @Column(name = "channel_id")
    private UUID channelId;
    @Column(name = "utm_source", length = 100)
    private String utmSource;
    @Column(name = "utm_medium", length = 100)
    private String utmMedium;
    @Column(name = "utm_campaign", length = 200)
    private String utmCampaign;
    @Column(name = "utm_content", length = 300)
    private String utmContent;
    @Column(name = "utm_term", length = 300)
    private String utmTerm;
    @Column(length = 300)
    private String yclid;
    @Column(length = 300)
    private String ysclid;
    @Column(length = 300)
    private String gclid;
    @Column(length = 300)
    private String fbclid;
    @Column(name = "vk_click_id", length = 300)
    private String vkClickId;
    @Column(name = "landing_url", length = 2000)
    private String landingUrl;
    @Column(length = 2000)
    private String referrer;
    @Column(name = "ip_hash", length = 64)
    private String ipHash;
    @Column(name = "user_agent_hash", length = 64)
    private String userAgentHash;
    @Column(name = "client_created_at")
    private Instant clientCreatedAt;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected MarketingVisitEntity() {}

    public MarketingVisitEntity(UUID id, String visitorId, UUID channelId, String utmSource, String utmMedium,
                                String utmCampaign, String utmContent, String utmTerm, String yclid, String ysclid,
                                String gclid, String fbclid, String vkClickId, String landingUrl, String referrer,
                                String ipHash, String userAgentHash, Instant clientCreatedAt, Instant createdAt) {
        this.id = id;
        this.visitorId = visitorId;
        this.channelId = channelId;
        this.utmSource = utmSource;
        this.utmMedium = utmMedium;
        this.utmCampaign = utmCampaign;
        this.utmContent = utmContent;
        this.utmTerm = utmTerm;
        this.yclid = yclid;
        this.ysclid = ysclid;
        this.gclid = gclid;
        this.fbclid = fbclid;
        this.vkClickId = vkClickId;
        this.landingUrl = landingUrl;
        this.referrer = referrer;
        this.ipHash = ipHash;
        this.userAgentHash = userAgentHash;
        this.clientCreatedAt = clientCreatedAt;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public String getVisitorId() { return visitorId; }
    public String getUtmSource() { return utmSource; }
    public String getUtmMedium() { return utmMedium; }
    public String getUtmCampaign() { return utmCampaign; }
    public String getUtmContent() { return utmContent; }
    public String getUtmTerm() { return utmTerm; }
    public Instant getCreatedAt() { return createdAt; }
}
