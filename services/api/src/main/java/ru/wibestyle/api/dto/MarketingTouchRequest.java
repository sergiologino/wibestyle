package ru.wibestyle.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MarketingTouchRequest(
        @JsonProperty("utm_source") String utmSource,
        @JsonProperty("utm_medium") String utmMedium,
        @JsonProperty("utm_campaign") String utmCampaign,
        @JsonProperty("utm_content") String utmContent,
        @JsonProperty("utm_term") String utmTerm,
        String yclid,
        String ysclid,
        String gclid,
        String fbclid,
        @JsonProperty("vk_click_id") String vkClickId,
        @JsonProperty("landing_url") String landingUrl,
        String referrer
) {
}
