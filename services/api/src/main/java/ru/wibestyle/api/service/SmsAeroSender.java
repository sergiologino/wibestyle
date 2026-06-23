package ru.wibestyle.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ru.wibestyle.api.config.SmsProperties;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

public class SmsAeroSender implements SmsSender {

    private final SmsProperties smsProperties;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public SmsAeroSender(SmsProperties smsProperties) {
        this(smsProperties, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build(), new ObjectMapper());
    }

    SmsAeroSender(SmsProperties smsProperties, HttpClient httpClient, ObjectMapper objectMapper) {
        this.smsProperties = smsProperties;
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public void sendOtpCode(String phone, String code) {
        if (!smsProperties.isConfigured()) {
            throw new SmsDeliveryException("SMS_NOT_CONFIGURED");
        }

        String normalizedPhone = phone.replaceAll("[^0-9]", "");
        String message = "Код входа vibestyle.art: " + code;
        String url = smsProperties.getBaseUrl() + "/sms/send"
                + "?number=" + encode(normalizedPhone)
                + "&text=" + encode(message)
                + "&sign=" + encode(smsProperties.getSign())
                + "&channel=" + encode(smsProperties.getChannel());
        String credentials = smsProperties.getEmail() + ":" + smsProperties.getApiKey();
        String authorization = "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

        try {
            HttpResponse<String> response = httpClient.send(
                    HttpRequest.newBuilder(URI.create(url))
                            .timeout(Duration.ofSeconds(20))
                            .header("Authorization", authorization)
                            .header("Accept", "application/json")
                            .GET()
                            .build(),
                    HttpResponse.BodyHandlers.ofString()
            );
            JsonNode payload = objectMapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300 || !payload.path("success").asBoolean(false)) {
                throw new SmsDeliveryException("SMS_SEND_FAILED");
            }
        } catch (SmsDeliveryException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new SmsDeliveryException("SMS_SEND_FAILED", ex);
        }
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
