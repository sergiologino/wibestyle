package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.mail")
public class MailProperties {

    private boolean enabled = false;
    private String from = "noreply@vibestyle.art";
    private boolean devLogOnly = true;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public boolean isDevLogOnly() {
        return devLogOnly;
    }

    public void setDevLogOnly(boolean devLogOnly) {
        this.devLogOnly = devLogOnly;
    }
}
