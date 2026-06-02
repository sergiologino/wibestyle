package ru.wibestyle.api.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AuthPropertiesTest {

    @Test
    void refreshTokenDefaultTtlIsAtLeastOneYear() {
        AuthProperties properties = new AuthProperties();

        assertThat(properties.getRefreshTokenTtlSeconds()).isGreaterThanOrEqualTo(365 * 24 * 60 * 60);
    }
}
