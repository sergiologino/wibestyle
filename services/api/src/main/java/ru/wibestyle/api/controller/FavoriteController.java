package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.dto.CreateFavoriteRequest;
import ru.wibestyle.api.service.FavoriteService;
import ru.wibestyle.api.support.AuthSupport;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public Map<String, Object> list(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return favoriteService.list(requireUserId(authorization));
    }

    @PostMapping
    public Map<String, Object> add(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody CreateFavoriteRequest request
    ) {
        return favoriteService.add(requireUserId(authorization), request);
    }

    @DeleteMapping("/{marketplace}/{externalProductId}")
    public Map<String, Object> remove(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String marketplace,
            @PathVariable String externalProductId
    ) {
        return favoriteService.remove(requireUserId(authorization), marketplace, externalProductId);
    }

    private UUID requireUserId(String authorization) {
        try {
            return AuthSupport.requireUserId(authorization);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized", ex);
        }
    }
}
