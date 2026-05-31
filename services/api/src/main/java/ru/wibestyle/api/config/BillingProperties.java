package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.billing")
public class BillingProperties {

    private String provider = "mock";
    private boolean subscribeDevEnabled = true;
    private String returnUrl = "http://localhost:3001/paywall/return";
    private int wibeMonthlyRub = 400;
    private int wibeAnnualRub = 3840;
    private int eliteMonthlyRub = 900;
    private int eliteAnnualRub = 8640;
    private int wibeGenerations = 20;
    private int eliteGenerations = 100;
    private int annualDiscountPercent = 20;
    private final YooKassa yookassa = new YooKassa();

    public boolean usesYooKassa() {
        return "yookassa".equalsIgnoreCase(provider);
    }

    public boolean yooKassaConfigured() {
        return usesYooKassa()
                && yookassa.getShopId() != null && !yookassa.getShopId().isBlank()
                && yookassa.getSecretKey() != null && !yookassa.getSecretKey().isBlank();
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public boolean isSubscribeDevEnabled() {
        return subscribeDevEnabled;
    }

    public void setSubscribeDevEnabled(boolean subscribeDevEnabled) {
        this.subscribeDevEnabled = subscribeDevEnabled;
    }

    public String getReturnUrl() {
        return returnUrl;
    }

    public void setReturnUrl(String returnUrl) {
        this.returnUrl = returnUrl;
    }

    public int getWibeMonthlyRub() {
        return wibeMonthlyRub;
    }

    public void setWibeMonthlyRub(int wibeMonthlyRub) {
        this.wibeMonthlyRub = wibeMonthlyRub;
    }

    public int getWibeAnnualRub() {
        return wibeAnnualRub;
    }

    public void setWibeAnnualRub(int wibeAnnualRub) {
        this.wibeAnnualRub = wibeAnnualRub;
    }

    public int getEliteMonthlyRub() {
        return eliteMonthlyRub;
    }

    public void setEliteMonthlyRub(int eliteMonthlyRub) {
        this.eliteMonthlyRub = eliteMonthlyRub;
    }

    public int getEliteAnnualRub() {
        return eliteAnnualRub;
    }

    public void setEliteAnnualRub(int eliteAnnualRub) {
        this.eliteAnnualRub = eliteAnnualRub;
    }

    public int getWibeGenerations() {
        return wibeGenerations;
    }

    public void setWibeGenerations(int wibeGenerations) {
        this.wibeGenerations = wibeGenerations;
    }

    public int getEliteGenerations() {
        return eliteGenerations;
    }

    public void setEliteGenerations(int eliteGenerations) {
        this.eliteGenerations = eliteGenerations;
    }

    public int getAnnualDiscountPercent() {
        return annualDiscountPercent;
    }

    public void setAnnualDiscountPercent(int annualDiscountPercent) {
        this.annualDiscountPercent = annualDiscountPercent;
    }

    public YooKassa getYookassa() {
        return yookassa;
    }

    public static class YooKassa {
        private String shopId = "";
        private String secretKey = "";
        private String apiBaseUrl = "https://api.yookassa.ru";

        public String getShopId() {
            return shopId;
        }

        public void setShopId(String shopId) {
            this.shopId = shopId;
        }

        public String getSecretKey() {
            return secretKey;
        }

        public void setSecretKey(String secretKey) {
            this.secretKey = secretKey;
        }

        public String getApiBaseUrl() {
            return apiBaseUrl;
        }

        public void setApiBaseUrl(String apiBaseUrl) {
            this.apiBaseUrl = apiBaseUrl;
        }
    }
}
