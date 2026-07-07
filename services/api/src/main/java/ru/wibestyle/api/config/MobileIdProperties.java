package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.mobile-id")
public class MobileIdProperties {
    private boolean enabled;
    private String clientId = "";
    private String apiSecret = "";
    private String baseUrl = "https://midsdk.smsaero.ru";
    private int timeoutSeconds = 15;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId == null ? "" : clientId.trim(); }
    public String getApiSecret() { return apiSecret; }
    public void setApiSecret(String apiSecret) { this.apiSecret = apiSecret == null ? "" : apiSecret.trim(); }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl == null || baseUrl.isBlank()
                ? "https://midsdk.smsaero.ru"
                : baseUrl.trim().replaceAll("/+$", "");
    }
    public int getTimeoutSeconds() { return timeoutSeconds; }
    public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = Math.max(1, timeoutSeconds); }
    public boolean isConfigured() {
        return enabled && !clientId.isBlank() && !apiSecret.isBlank();
    }
}
