package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import ru.wibestyle.api.dto.PushDeviceRequest;
import ru.wibestyle.api.service.NotificationService;
import ru.wibestyle.api.support.AuthSupport;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationService notificationService;
    public NotificationController(NotificationService notificationService) { this.notificationService = notificationService; }

    @GetMapping
    public Map<String, Object> list(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return notificationService.list(AuthSupport.requireUserId(authorization));
    }

    @PostMapping("/{notificationId}/read")
    public Map<String, Object> read(@RequestHeader(value = "Authorization", required = false) String authorization,
                                    @PathVariable UUID notificationId) {
        return notificationService.markRead(AuthSupport.requireUserId(authorization), notificationId);
    }

    @PostMapping("/push-devices")
    public Map<String, Object> register(@RequestHeader(value = "Authorization", required = false) String authorization,
                                        @Valid @RequestBody PushDeviceRequest request) {
        notificationService.registerPushDevice(AuthSupport.requireUserId(authorization), request.token(), request.platform());
        return Map.of("status", "registered");
    }

    @DeleteMapping("/push-devices")
    public Map<String, Object> unregister(@RequestHeader(value = "Authorization", required = false) String authorization,
                                          @Valid @RequestBody PushDeviceRequest request) {
        notificationService.unregisterPushDevice(AuthSupport.requireUserId(authorization), request.token());
        return Map.of("status", "unregistered");
    }
}
