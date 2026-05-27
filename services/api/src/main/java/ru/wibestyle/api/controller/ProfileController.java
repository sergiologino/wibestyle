package ru.wibestyle.api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.wibestyle.api.dto.DeleteAccountRequest;
import ru.wibestyle.api.dto.UpdateProfileRequest;
import ru.wibestyle.api.service.AccountDeletionService;
import ru.wibestyle.api.service.ProfileService;
import ru.wibestyle.api.support.AuthSupport;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {

    private final ProfileService profileService;
    private final AccountDeletionService accountDeletionService;

    public ProfileController(ProfileService profileService, AccountDeletionService accountDeletionService) {
        this.profileService = profileService;
        this.accountDeletionService = accountDeletionService;
    }

    @GetMapping
    public Map<String, Object> getProfile(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return profileService.getProfile(requireUserId(authorization));
    }

    @PutMapping
    public Map<String, Object> updateProfile(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody UpdateProfileRequest request
    ) {
        return profileService.updateProfile(requireUserId(authorization), request);
    }

    @DeleteMapping
    public Map<String, Object> resetProfile(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return profileService.resetProfile(requireUserId(authorization));
    }

    @PostMapping("/delete-account")
    public Map<String, Object> deleteAccount(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody DeleteAccountRequest request
    ) {
        return accountDeletionService.deleteAccount(requireUserId(authorization), request.confirm());
    }

    private UUID requireUserId(String authorization) {
        try {
            return AuthSupport.requireUserId(authorization);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized", ex);
        }
    }
}
