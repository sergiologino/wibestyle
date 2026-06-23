package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.sms")
public class SmsProperties {

    private String email = "";
    private String apiKey = "";
    private String sign = "SMS Aero";
    private String channel = "DIRECT";
    private String baseUrl = "https://gate.smsaero.ru/v2";
    private String devStubCode = "0000";

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email == null ? "" : email.trim();
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
    }

    public String getSign() {
        return sign;
    }

    public void setSign(String sign) {
        this.sign = sign == null || sign.isBlank() ? "SMS Aero" : sign.trim();
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel == null || channel.isBlank() ? "DIRECT" : channel.trim();
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl == null || baseUrl.isBlank()
                ? "https://gate.smsaero.ru/v2"
                : baseUrl.trim().replaceAll("/+$", "");
    }

    public String getDevStubCode() {
        return devStubCode;
    }

    public void setDevStubCode(String devStubCode) {
        this.devStubCode = devStubCode == null ? "0000" : devStubCode;
    }

    public boolean isConfigured() {
        return email != null && !email.isBlank() && apiKey != null && !apiKey.isBlank();
    }
}
