package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.push")
public class PushProperties {
    private boolean enabled = true;
    private String expoApiUrl = "https://exp.host/--/api/v2/push/send";
    private String accessToken = "";

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getExpoApiUrl() { return expoApiUrl; }
    public void setExpoApiUrl(String expoApiUrl) { this.expoApiUrl = expoApiUrl; }
    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
}
