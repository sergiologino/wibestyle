package ru.wibestyle.api.config;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class FeatureFlagsPropertiesTest {

    @Test
    void stylistCanBeLimitedToFocusGroup() {
        FeatureFlagsProperties flags = new FeatureFlagsProperties();
        flags.setFlags(Map.of("stylist", true));
        flags.setStylistFocusGroupOnly(true);

        assertThat(flags.isStylistAvailableFor(false)).isFalse();
        assertThat(flags.isStylistAvailableFor(true)).isTrue();
    }

    @Test
    void stylistCanBeOpenedForEveryoneByEnvironmentFlag() {
        FeatureFlagsProperties flags = new FeatureFlagsProperties();
        flags.setFlags(Map.of("stylist", true));
        flags.setStylistFocusGroupOnly(false);

        assertThat(flags.isStylistAvailableFor(false)).isTrue();
    }

    @Test
    void disabledStylistFlagWinsOverFocusGroup() {
        FeatureFlagsProperties flags = new FeatureFlagsProperties();
        flags.setFlags(Map.of("stylist", false));
        flags.setStylistFocusGroupOnly(false);

        assertThat(flags.isStylistAvailableFor(true)).isFalse();
    }
}
