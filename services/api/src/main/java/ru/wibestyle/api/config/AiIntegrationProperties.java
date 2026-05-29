package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.ai")
public class AiIntegrationProperties {

    private boolean enabled = false;
    private String baseUrl = "http://localhost:8091";
    private String apiKey = "";
    private boolean fallbackToDemo = true;
    private boolean asyncEnabled = true;
    private int timeoutSeconds = 90;
    private String virtualTryOnNetwork = "";
    /** Image-to-video network in noteapp for season hit clips. */
    private String seasonVideoNetwork = "";
    /** OpenAI-compatible chat network in noteapp (e.g. gpt-4o-mini) for size compliments. */
    private String sizeComplimentNetwork = "";
    private String webhookSecret = "";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public boolean isFallbackToDemo() {
        return fallbackToDemo;
    }

    public void setFallbackToDemo(boolean fallbackToDemo) {
        this.fallbackToDemo = fallbackToDemo;
    }

    public boolean isAsyncEnabled() {
        return asyncEnabled;
    }

    public void setAsyncEnabled(boolean asyncEnabled) {
        this.asyncEnabled = asyncEnabled;
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public void setTimeoutSeconds(int timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }

    public String getVirtualTryOnNetwork() {
        return virtualTryOnNetwork;
    }

    public void setVirtualTryOnNetwork(String virtualTryOnNetwork) {
        this.virtualTryOnNetwork = virtualTryOnNetwork;
    }

    public String getSeasonVideoNetwork() {
        return seasonVideoNetwork;
    }

    public void setSeasonVideoNetwork(String seasonVideoNetwork) {
        this.seasonVideoNetwork = seasonVideoNetwork;
    }

    public String getSizeComplimentNetwork() {
        return sizeComplimentNetwork;
    }

    public void setSizeComplimentNetwork(String sizeComplimentNetwork) {
        this.sizeComplimentNetwork = sizeComplimentNetwork;
    }

    public String getWebhookSecret() {
        return webhookSecret;
    }

    public void setWebhookSecret(String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }

    public boolean isNoteappConfigured() {
        return enabled && apiKey != null && !apiKey.isBlank() && virtualTryOnNetwork != null && !virtualTryOnNetwork.isBlank();
    }

    public boolean isSeasonVideoConfigured() {
        return enabled && apiKey != null && !apiKey.isBlank() && seasonVideoNetwork != null && !seasonVideoNetwork.isBlank();
    }
}
