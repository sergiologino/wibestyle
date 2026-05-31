package ru.wibestyle.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.wibestyle.api.billing.yookassa.YooKassaClient;
import ru.wibestyle.api.billing.yookassa.YooKassaPaymentResult;
import ru.wibestyle.api.config.BillingProperties;
import ru.wibestyle.api.domain.BillingCheckoutEntity;
import ru.wibestyle.api.domain.UserProfileEntity;
import ru.wibestyle.api.repository.BillingCheckoutRepository;
import ru.wibestyle.api.repository.UserProfileRepository;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BillingServiceYooKassaTest {

    @Mock
    private UserProfileRepository userProfileRepository;
    @Mock
    private QuotaService quotaService;
    @Mock
    private BillingCheckoutRepository billingCheckoutRepository;
    @Mock
    private YooKassaClient yooKassaClient;

    private BillingService billingService;
    private UUID userId;

    @BeforeEach
    void setUp() {
        BillingProperties properties = new BillingProperties();
        properties.setProvider("yookassa");
        properties.getYookassa().setShopId("shop");
        properties.getYookassa().setSecretKey("secret");
        properties.setReturnUrl("http://localhost:3001/paywall/return");

        billingService = new BillingService(
                properties,
                userProfileRepository,
                quotaService,
                billingCheckoutRepository,
                yooKassaClient
        );
        userId = UUID.randomUUID();
    }

    @Test
    void createCheckoutUsesYooKassaRedirect() {
        UserProfileEntity profile = profile(userId);
        when(userProfileRepository.findById(userId)).thenReturn(Optional.of(profile));
        when(yooKassaClient.createRedirectPayment(any(), anyInt(), anyString(), eq(userId)))
                .thenReturn(new YooKassaPaymentResult("pay-1", "pending", "https://yoomoney.ru/pay/test"));

        ArgumentCaptor<BillingCheckoutEntity> captor = ArgumentCaptor.forClass(BillingCheckoutEntity.class);
        when(billingCheckoutRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = billingService.createCheckout(userId, "wibe", "annual");

        assertThat(result.get("provider")).isEqualTo("yookassa");
        assertThat(result.get("paymentUrl")).isEqualTo("https://yoomoney.ru/pay/test");
        assertThat(captor.getValue().getExternalPaymentId()).isEqualTo("pay-1");
    }

    @Test
    void getCheckoutSyncsSucceededPayment() {
        UUID checkoutId = UUID.randomUUID();
        BillingCheckoutEntity checkout = new BillingCheckoutEntity(
                checkoutId, userId, "wibe", "annual", 3840, "yookassa", Instant.now()
        );
        checkout.setExternalPaymentId("pay-99");
        UserProfileEntity profile = profile(userId);

        when(billingCheckoutRepository.findByIdAndUserId(checkoutId, userId)).thenReturn(Optional.of(checkout));
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode payment = mapper.createObjectNode();
        payment.put("status", "succeeded");
        ObjectNode amount = payment.putObject("amount");
        amount.put("value", "3840.00");
        when(yooKassaClient.fetchPayment("pay-99")).thenReturn(payment);
        when(userProfileRepository.findById(userId)).thenReturn(Optional.of(profile));
        when(quotaService.defaultGenerationsForPlan("wibe")).thenReturn(20);
        when(billingCheckoutRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = billingService.getCheckout(userId, checkoutId);

        assertThat(result.get("status")).isEqualTo("completed");
        verify(userProfileRepository).save(profile);
        assertThat(profile.getPlan()).isEqualTo("wibe");
    }

    private static UserProfileEntity profile(UUID userId) {
        UserProfileEntity profile = new UserProfileEntity(userId, Instant.now());
        profile.setPlan("trial");
        profile.setTrialGenerationsLeft(3);
        return profile;
    }
}
