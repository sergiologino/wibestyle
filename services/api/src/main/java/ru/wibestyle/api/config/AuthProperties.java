package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.auth")
public class AuthProperties {

    private int otpTtlSeconds = 300;
    private int otpResendCooldownSeconds = 60;
    private int otpMaxAttempts = 5;
    private int accessTokenTtlSeconds = 2_592_000;
    private int refreshTokenTtlSeconds = 31_536_000;
    private String refreshTokenStore = "jdbc";
    private String jwtSecret = "dev-jwt-secret-change-me-in-production-min-32-chars";
    private boolean legacyAccessTokenEnabled = true;
    /** When set, OTP codes use this value (tests/dev). Empty = random code. */
    private String otpDevFixedCode = "";

    public int getOtpTtlSeconds() {
        return otpTtlSeconds;
    }

    public void setOtpTtlSeconds(int otpTtlSeconds) {
        this.otpTtlSeconds = otpTtlSeconds;
    }

    public int getOtpResendCooldownSeconds() {
        return otpResendCooldownSeconds;
    }

    public void setOtpResendCooldownSeconds(int otpResendCooldownSeconds) {
        this.otpResendCooldownSeconds = otpResendCooldownSeconds;
    }

    public int getOtpMaxAttempts() {
        return otpMaxAttempts;
    }

    public void setOtpMaxAttempts(int otpMaxAttempts) {
        this.otpMaxAttempts = otpMaxAttempts;
    }

    public int getAccessTokenTtlSeconds() {
        return accessTokenTtlSeconds;
    }

    public void setAccessTokenTtlSeconds(int accessTokenTtlSeconds) {
        this.accessTokenTtlSeconds = accessTokenTtlSeconds;
    }

    public int getRefreshTokenTtlSeconds() {
        return refreshTokenTtlSeconds;
    }

    public void setRefreshTokenTtlSeconds(int refreshTokenTtlSeconds) {
        this.refreshTokenTtlSeconds = refreshTokenTtlSeconds;
    }

    public String getRefreshTokenStore() {
        return refreshTokenStore;
    }

    public void setRefreshTokenStore(String refreshTokenStore) {
        this.refreshTokenStore = refreshTokenStore;
    }

    private static final String DEFAULT_JWT_SECRET = "dev-jwt-secret-change-me-in-production-min-32-chars";

    public String getJwtSecret() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            return DEFAULT_JWT_SECRET;
        }
        return jwtSecret.trim();
    }

    public void setJwtSecret(String jwtSecret) {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            this.jwtSecret = DEFAULT_JWT_SECRET;
            return;
        }
        this.jwtSecret = jwtSecret.trim();
    }

    public boolean isLegacyAccessTokenEnabled() {
        return legacyAccessTokenEnabled;
    }

    public void setLegacyAccessTokenEnabled(boolean legacyAccessTokenEnabled) {
        this.legacyAccessTokenEnabled = legacyAccessTokenEnabled;
    }

    public String getOtpDevFixedCode() {
        return otpDevFixedCode;
    }

    public void setOtpDevFixedCode(String otpDevFixedCode) {
        this.otpDevFixedCode = otpDevFixedCode == null ? "" : otpDevFixedCode.trim();
    }

    public boolean hasOtpDevFixedCode() {
        return otpDevFixedCode != null && !otpDevFixedCode.isBlank();
    }
}
