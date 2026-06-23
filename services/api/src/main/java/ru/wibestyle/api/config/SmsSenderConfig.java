package ru.wibestyle.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import ru.wibestyle.api.service.LoggingSmsSender;
import ru.wibestyle.api.service.SmsAeroSender;
import ru.wibestyle.api.service.SmsSender;

@Configuration
public class SmsSenderConfig {

    @Bean
    SmsSender smsSender(SmsProperties smsProperties) {
        if (smsProperties.isConfigured()) {
            return new SmsAeroSender(smsProperties);
        }
        return new LoggingSmsSender();
    }
}
