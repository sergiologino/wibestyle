package ru.wibestyle.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.config.AiIntegrationProperties;
import ru.wibestyle.api.config.AuthProperties;
import ru.wibestyle.api.config.BillingProperties;
import ru.wibestyle.api.config.FeatureFlagsProperties;
import ru.wibestyle.api.config.SecurityProperties;
import ru.wibestyle.api.config.GeoIpProperties;
import ru.wibestyle.api.config.MailProperties;
import ru.wibestyle.api.config.MarketingProperties;
import ru.wibestyle.api.config.OAuthProperties;
import ru.wibestyle.api.config.SmsProperties;
import ru.wibestyle.api.config.StorageProperties;
import ru.wibestyle.api.config.PushProperties;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties({
        FeatureFlagsProperties.class,
        StorageProperties.class,
        AiIntegrationProperties.class,
        BillingProperties.class,
        AdminProperties.class,
        AuthProperties.class,
        SecurityProperties.class,
        OAuthProperties.class,
        MailProperties.class,
        MarketingProperties.class,
        GeoIpProperties.class,
        SmsProperties.class,
        PushProperties.class
})
public class WibestyleApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(WibestyleApiApplication.class, args);
    }
}
