package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.admin")
public class AdminProperties {

    private String apiKey = "dev-admin-key";
    private String bootstrapPassword = "dev-admin-password";

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getBootstrapPassword() {
        return bootstrapPassword;
    }

    public void setBootstrapPassword(String bootstrapPassword) {
        this.bootstrapPassword = bootstrapPassword;
    }
}
