package ru.wibestyle.api.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SmsPropertiesTest {

    @Test
    void requiresSmsAeroEmailAndApiKey() {
        SmsProperties properties = new SmsProperties();

        assertThat(properties.isConfigured()).isFalse();
        properties.setEmail("user@example.com");
        assertThat(properties.isConfigured()).isFalse();
        properties.setApiKey("secret");

        assertThat(properties.isConfigured()).isTrue();
        assertThat(properties.getBaseUrl()).isEqualTo("https://gate.smsaero.ru/v2");
        assertThat(properties.getChannel()).isEqualTo("DIRECT");
    }
}
