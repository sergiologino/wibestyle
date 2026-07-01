package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.marketing")
public class MarketingProperties {
    private String hashSalt = "change-me";

    public String getHashSalt() { return hashSalt; }
    public void setHashSalt(String hashSalt) { this.hashSalt = hashSalt; }
}
