package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.billing")
public class BillingProperties {

    private int wibeMonthlyRub = 400;
    private int wibeAnnualRub = 3840;
    private int eliteMonthlyRub = 900;
    private int eliteAnnualRub = 8640;
    private int wibeGenerations = 20;
    private int eliteGenerations = 100;
    private int annualDiscountPercent = 20;

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
}
