package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.sms")
public class SmsProperties {

    private String apiId = "";
    private String devStubCode = "0000";

    public String getApiId() {
        return apiId;
    }

    public void setApiId(String apiId) {
        this.apiId = apiId == null ? "" : apiId.trim();
    }

    public String getDevStubCode() {
        return devStubCode;
    }

    public void setDevStubCode(String devStubCode) {
        this.devStubCode = devStubCode == null ? "0000" : devStubCode;
    }

    public boolean isConfigured() {
        return apiId != null && !apiId.isBlank();
    }
}
