package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.geoip")
public class GeoIpProperties {

    /** Used when IP is local/private and no country header is present. */
    private String defaultCountry = "";

    public String getDefaultCountry() {
        return defaultCountry;
    }

    public void setDefaultCountry(String defaultCountry) {
        this.defaultCountry = defaultCountry == null ? "" : defaultCountry.trim().toUpperCase();
    }
}
