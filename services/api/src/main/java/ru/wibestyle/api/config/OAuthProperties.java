package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.oauth")
public class OAuthProperties {

    private String webAppCallbackUrl = "http://localhost:3001/auth/oauth/callback";
    private String mobileAppCallbackUrl = "wibestyle://auth/oauth/callback";
    private String apiPublicBaseUrl = "http://localhost:8080";
    private Provider yandex = new Provider();
    private Provider google = new Provider();

    public String getWebAppCallbackUrl() {
        return webAppCallbackUrl;
    }

    public void setWebAppCallbackUrl(String webAppCallbackUrl) {
        this.webAppCallbackUrl = webAppCallbackUrl;
    }

    public String getMobileAppCallbackUrl() {
        return mobileAppCallbackUrl;
    }

    public void setMobileAppCallbackUrl(String mobileAppCallbackUrl) {
        this.mobileAppCallbackUrl = mobileAppCallbackUrl;
    }

    public String getApiPublicBaseUrl() {
        return apiPublicBaseUrl;
    }

    public void setApiPublicBaseUrl(String apiPublicBaseUrl) {
        this.apiPublicBaseUrl = apiPublicBaseUrl;
    }

    public Provider getYandex() {
        return yandex;
    }

    public void setYandex(Provider yandex) {
        this.yandex = yandex;
    }

    public Provider getGoogle() {
        return google;
    }

    public void setGoogle(Provider google) {
        this.google = google;
    }

    public static class Provider {
        private boolean enabled;
        private String clientId = "";
        private String clientSecret = "";

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getClientId() {
            return clientId;
        }

        public void setClientId(String clientId) {
            this.clientId = clientId;
        }

        public String getClientSecret() {
            return clientSecret;
        }

        public void setClientSecret(String clientSecret) {
            this.clientSecret = clientSecret;
        }

        public boolean isConfigured() {
            return enabled && clientId != null && !clientId.isBlank() && clientSecret != null && !clientSecret.isBlank();
        }
    }
}
