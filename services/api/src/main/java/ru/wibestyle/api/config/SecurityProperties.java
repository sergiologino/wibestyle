package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.security")
public class SecurityProperties {

    private boolean rateLimitEnabled = true;
    private int otpStartPerMinute = 10;
    private int mediaAccessTtlSeconds = 900;
    private long maxUploadBytes = 10 * 1024 * 1024;

    public boolean isRateLimitEnabled() {
        return rateLimitEnabled;
    }

    public void setRateLimitEnabled(boolean rateLimitEnabled) {
        this.rateLimitEnabled = rateLimitEnabled;
    }

    public int getOtpStartPerMinute() {
        return otpStartPerMinute;
    }

    public void setOtpStartPerMinute(int otpStartPerMinute) {
        this.otpStartPerMinute = otpStartPerMinute;
    }

    public int getMediaAccessTtlSeconds() {
        return mediaAccessTtlSeconds;
    }

    public void setMediaAccessTtlSeconds(int mediaAccessTtlSeconds) {
        this.mediaAccessTtlSeconds = mediaAccessTtlSeconds;
    }

    public long getMaxUploadBytes() {
        return maxUploadBytes;
    }

    public void setMaxUploadBytes(long maxUploadBytes) {
        this.maxUploadBytes = maxUploadBytes;
    }
}
