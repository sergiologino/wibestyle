package ru.wibestyle.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import ru.wibestyle.api.config.SmsProperties;

import java.net.InetSocketAddress;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SmsAeroSenderTest {

    @Test
    void sendsOtpThroughSmsAeroV2WithBasicAuth() throws Exception {
        AtomicReference<String> authorization = new AtomicReference<>();
        AtomicReference<String> query = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v2/sms/send", exchange -> {
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            query.set(exchange.getRequestURI().getRawQuery());
            byte[] response = "{\"success\":true,\"data\":{\"id\":1}}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();

        try {
            SmsProperties properties = configuredProperties(server.getAddress().getPort());
            SmsAeroSender sender = new SmsAeroSender(properties, HttpClient.newHttpClient(), new ObjectMapper());

            sender.sendOtpCode("+7 (900) 123-45-67", "123456");

            String credentials = Base64.getEncoder().encodeToString("user@example.com:secret".getBytes(StandardCharsets.UTF_8));
            assertThat(authorization.get()).isEqualTo("Basic " + credentials);
            assertThat(query.get())
                    .contains("number=79001234567")
                    .contains("text=%D0%9A%D0%BE%D0%B4+")
                    .contains("sign=VibeStyle")
                    .contains("channel=DIRECT");
        } finally {
            server.stop(0);
        }
    }

    @Test
    void rejectsSmsAeroErrorPayload() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v2/sms/send", exchange -> {
            byte[] response = "{\"success\":false,\"message\":\"invalid api key\"}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();

        try {
            SmsAeroSender sender = new SmsAeroSender(
                    configuredProperties(server.getAddress().getPort()),
                    HttpClient.newHttpClient(),
                    new ObjectMapper()
            );

            assertThatThrownBy(() -> sender.sendOtpCode("79001234567", "123456"))
                    .isInstanceOf(SmsDeliveryException.class)
                    .hasMessage("SMS_SEND_FAILED");
        } finally {
            server.stop(0);
        }
    }

    private static SmsProperties configuredProperties(int port) {
        SmsProperties properties = new SmsProperties();
        properties.setEmail("user@example.com");
        properties.setApiKey("secret");
        properties.setSign("VibeStyle");
        properties.setBaseUrl("http://127.0.0.1:" + port + "/v2");
        return properties;
    }
}
