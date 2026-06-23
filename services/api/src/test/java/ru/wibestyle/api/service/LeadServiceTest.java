package ru.wibestyle.api.service;

import org.junit.jupiter.api.Test;
import ru.wibestyle.api.domain.PromoCodeEntity;
import ru.wibestyle.api.repository.LandingLeadRepository;
import ru.wibestyle.api.repository.PromoCodeRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LeadServiceTest {

    private final LandingLeadRepository leadRepository = mock(LandingLeadRepository.class);
    private final PromoCodeRepository promoRepository = mock(PromoCodeRepository.class);
    private final LeadService service = new LeadService(leadRepository, promoRepository, 6990, 3495);

    @Test
    void reportsSeededFirstHundredAvailability() {
        PromoCodeEntity promo = promo(29);
        when(promoRepository.findByCode("FIRST100")).thenReturn(Optional.of(promo));

        assertThat(service.publicStats()).containsAllEntriesOf(Map.of(
                "remainingSpots", 71,
                "promoActive", true,
                "discountPercent", 50
        ));
    }

    @Test
    void hidesPromotionWhenAllUsesAreExhausted() {
        PromoCodeEntity promo = promo(100);
        when(promoRepository.findByCode("FIRST100")).thenReturn(Optional.of(promo));

        assertThat(service.publicStats()).containsAllEntriesOf(Map.of(
                "remainingSpots", 0,
                "promoActive", false,
                "discountPercent", 0
        ));
    }

    private static PromoCodeEntity promo(int usesCount) {
        PromoCodeEntity promo = new PromoCodeEntity(
                UUID.randomUUID(),
                "FIRST100",
                50,
                100,
                Instant.now().plus(365, ChronoUnit.DAYS),
                "Первые 100 пользователей",
                Instant.now()
        );
        promo.setUsesCount(usesCount);
        return promo;
    }
}
