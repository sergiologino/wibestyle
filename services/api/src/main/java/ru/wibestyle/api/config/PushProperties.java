package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.push")
public class PushProperties {
    private boolean enabled = true;
    private String expoApiUrl = "https://exp.host/--/api/v2/push/send";
    private String accessToken = "";
    private String primaryProvider = "rustore";
    private String rustoreApiBaseUrl = "https://vkpns.rustore.ru";
    private String rustoreProjectId = "";
    private String rustoreServiceToken = "";

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getExpoApiUrl() { return expoApiUrl; }
    public void setExpoApiUrl(String expoApiUrl) { this.expoApiUrl = expoApiUrl; }
    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public String getPrimaryProvider() { return primaryProvider; }
    public void setPrimaryProvider(String primaryProvider) { this.primaryProvider = primaryProvider; }
    public String getRustoreApiBaseUrl() { return rustoreApiBaseUrl; }
    public void setRustoreApiBaseUrl(String rustoreApiBaseUrl) { this.rustoreApiBaseUrl = rustoreApiBaseUrl; }
    public String getRustoreProjectId() { return rustoreProjectId; }
    public void setRustoreProjectId(String rustoreProjectId) { this.rustoreProjectId = rustoreProjectId; }
    public String getRustoreServiceToken() { return rustoreServiceToken; }
    public void setRustoreServiceToken(String rustoreServiceToken) { this.rustoreServiceToken = rustoreServiceToken; }
    public boolean isRustoreConfigured() {
        return enabled
                && rustoreProjectId != null
                && !rustoreProjectId.isBlank()
                && rustoreServiceToken != null
                && !rustoreServiceToken.isBlank();
    }
}
