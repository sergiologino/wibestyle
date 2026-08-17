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
public class ExpoPushService {
    private static final Logger log = LoggerFactory.getLogger(ExpoPushService.class);
    private final PushProperties properties;
    private final PushDeviceRepository deviceRepository;
    private final RestClient restClient;

    public ExpoPushService(PushProperties properties, PushDeviceRepository deviceRepository) {
        this.properties = properties;
        this.deviceRepository = deviceRepository;
        this.restClient = RestClient.builder().build();
    }

    public int send(UUID userId, String title, String body, String actionUrl) {
        if (!properties.isEnabled()) return 0;
        int sent = 0;
        for (PushDeviceEntity device : deviceRepository.findByUserIdAndProviderAndEnabledTrue(userId, "expo")) {
            if (sendDevice(device, title, body, actionUrl)) {
                sent++;
            }
        }
        return sent;
    }

    public boolean sendDevice(PushDeviceEntity device, String title, String body, String actionUrl) {
        if (!properties.isEnabled()) return false;
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("to", device.getExpoPushToken());
            payload.put("title", title);
            payload.put("body", body);
            payload.put("sound", "default");
            payload.put("channelId", "subscription");
            payload.put("ttl", 604800);
            payload.put("data", actionUrl == null ? Map.of() : Map.of("actionUrl", actionUrl));
            var request = restClient.post().uri(properties.getExpoApiUrl())
                    .header("Accept", "application/json")
                    .header("Accept-Encoding", "gzip, deflate");
            if (properties.getAccessToken() != null && !properties.getAccessToken().isBlank()) {
                request = request.header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getAccessToken());
            }
            request.body(payload).retrieve().toBodilessEntity();
            return true;
        } catch (RuntimeException ex) {
            log.warn("Expo push delivery request failed for device {}: {}", device.getId(), ex.getMessage());
            return false;
        }
    }
}
