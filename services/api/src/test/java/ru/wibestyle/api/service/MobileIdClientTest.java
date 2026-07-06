package ru.wibestyle.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import ru.wibestyle.api.config.MobileIdProperties;

import java.net.InetSocketAddress;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class MobileIdClientTest {

    @Test
    void signsInitAndVerificationRequestsAndTrustsOnlyServerVerifiedPhone() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        AtomicReference<JsonNode> initPayload = new AtomicReference<>();
        AtomicReference<JsonNode> verifyPayload = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/token", exchange -> {
            initPayload.set(mapper.readTree(exchange.getRequestBody()));
            respond(exchange, "{\"token\":\"init-token\"}");
        });
        server.createContext("/api/siteverify", exchange -> {
            verifyPayload.set(mapper.readTree(exchange.getRequestBody()));
            respond(exchange, "{\"success\":true,\"phone\":\"79161234567\",\"status\":\"verified\"}");
        });
        server.start();

        try {
            MobileIdProperties properties = new MobileIdProperties();
            properties.setEnabled(true);
            properties.setClientId("pub_test");
            properties.setApiSecret("secret");
            properties.setBaseUrl("http://127.0.0.1:" + server.getAddress().getPort());
            MobileIdClient client = new MobileIdClient(
                    properties,
                    HttpClient.newHttpClient(),
                    mapper,
                    Clock.fixed(Instant.ofEpochSecond(1715000000), ZoneOffset.UTC)
            );

            assertThat(client.createInitToken("fingerprint")).isEqualTo("init-token");
            assertThat(client.verify("session", "verify-token").phone()).isEqualTo("79161234567");

            assertThat(initPayload.get().path("client_id").asText()).isEqualTo("pub_test");
            assertThat(initPayload.get().path("fingerprint_hash").asText()).isEqualTo("fingerprint");
            assertThat(initPayload.get().path("timestamp").asText()).isEqualTo("1715000000");
            assertThat(initPayload.get().path("signature").asText()).hasSize(64);
            assertThat(verifyPayload.get().path("session_id").asText()).isEqualTo("session");
            assertThat(verifyPayload.get().path("verify_token").asText()).isEqualTo("verify-token");
            assertThat(verifyPayload.get().path("signature").asText()).hasSize(64);
        } finally {
            server.stop(0);
        }
    }

    private static void respond(com.sun.net.httpserver.HttpExchange exchange, String body) throws java.io.IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
