package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.dto.SizeAdviceRequest;
import ru.wibestyle.api.service.SizeAdviceService;
import ru.wibestyle.api.support.AuthSupport;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/size-advice")
public class SizeAdviceController {

    private final SizeAdviceService sizeAdviceService;

    public SizeAdviceController(SizeAdviceService sizeAdviceService) {
        this.sizeAdviceService = sizeAdviceService;
    }

    @PostMapping
    public Map<String, Object> advise(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody SizeAdviceRequest request
    ) {
        try {
            return sizeAdviceService.advise(requireUserId(authorization), request);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    private UUID requireUserId(String authorization) {
        try {
            return AuthSupport.requireUserId(authorization);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized", ex);
        }
    }
}
