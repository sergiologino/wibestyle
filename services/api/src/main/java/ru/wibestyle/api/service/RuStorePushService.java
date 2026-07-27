package ru.wibestyle.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import ru.wibestyle.api.config.PushProperties;
import ru.wibestyle.api.domain.PushDeviceEntity;
import ru.wibestyle.api.repository.PushDeviceRepository;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class RuStorePushService {
    private static final Logger log = LoggerFactory.getLogger(RuStorePushService.class);

    private final PushProperties properties;
    private final PushDeviceRepository deviceRepository;
    private final RestClient restClient;

    public RuStorePushService(PushProperties properties, PushDeviceRepository deviceRepository) {
        this.properties = properties;
        this.deviceRepository = deviceRepository;
        this.restClient = RestClient.builder().build();
    }

    public int send(UUID userId, String title, String body, String actionUrl) {
        if (!properties.isRustoreConfigured()) {
            return 0;
        }
        int sent = 0;
        String url = properties.getRustoreApiBaseUrl().replaceAll("/$", "")
                + "/v1/projects/" + properties.getRustoreProjectId() + "/messages:send";
        for (PushDeviceEntity device : deviceRepository.findByUserIdAndProviderAndEnabledTrue(userId, "rustore")) {
            try {
                Map<String, Object> notification = new LinkedHashMap<>();
                notification.put("title", title);
                notification.put("body", body);

                Map<String, Object> androidNotification = new LinkedHashMap<>(notification);
                androidNotification.put("channel_id", "subscription");
                if (actionUrl != null && !actionUrl.isBlank()) {
                    androidNotification.put("click_action", "wibestyle://" + actionUrl.replaceFirst("^/", ""));
                    androidNotification.put("click_action_type", 1);
                }

                Map<String, Object> android = new LinkedHashMap<>();
                android.put("ttl", "604800s");
                android.put("notification", androidNotification);

                Map<String, String> data = actionUrl == null || actionUrl.isBlank()
                        ? Map.of()
                        : Map.of("actionUrl", actionUrl);

                Map<String, Object> message = new LinkedHashMap<>();
                message.put("token", device.getExpoPushToken());
                message.put("notification", notification);
                message.put("android", android);
                message.put("data", data);

                restClient.post()
                        .uri(url)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getRustoreServiceToken())
                        .header(HttpHeaders.CONTENT_TYPE, "application/json")
                        .body(Map.of("message", message))
                        .retrieve()
                        .toBodilessEntity();
                sent++;
            } catch (RuntimeException ex) {
                log.warn("RuStore push delivery request failed for device {}: {}", device.getId(), ex.getMessage());
            }
        }
        return sent;
    }
}
