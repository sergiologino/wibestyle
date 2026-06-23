package ru.wibestyle.api.service;

import org.junit.jupiter.api.Test;
import ru.wibestyle.api.auth.JwtService;
import ru.wibestyle.api.auth.RefreshTokenStore;
import ru.wibestyle.api.config.AuthProperties;
import ru.wibestyle.api.config.SmsProperties;
import ru.wibestyle.api.repository.UserRepository;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;

class AuthServiceSmsFailureTest {

    @Test
    void failedDeliveryDoesNotLeaveCooldownOrChallenge() {
        SmsProperties smsProperties = new SmsProperties();
        smsProperties.setEmail("user@example.com");
        smsProperties.setApiKey("secret");
        SmsSender smsSender = mock(SmsSender.class);
        doThrow(new SmsDeliveryException("SMS_SEND_FAILED"))
                .doNothing()
                .when(smsSender).sendOtpCode(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());

        AuthService service = new AuthService(
                mock(UserRepository.class),
                mock(ProfileService.class),
                mock(PromoService.class),
                mock(JwtService.class),
                mock(RefreshTokenStore.class),
                new AuthProperties(),
                smsProperties,
                smsSender,
                mock(EmailSender.class)
        );

        assertThatThrownBy(() -> service.startOtp("+7 900 123-45-67"))
                .isInstanceOf(SmsDeliveryException.class);
        assertThatCode(() -> service.startOtp("+7 900 123-45-67")).doesNotThrowAnyException();
    }
}
