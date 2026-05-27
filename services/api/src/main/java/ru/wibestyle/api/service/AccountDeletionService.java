package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.auth.RefreshTokenStore;
import ru.wibestyle.api.repository.UserRepository;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class AccountDeletionService {

    private final UserRepository userRepository;
    private final LocalStorageService localStorageService;
    private final RefreshTokenStore refreshTokenStore;

    public AccountDeletionService(
            UserRepository userRepository,
            LocalStorageService localStorageService,
            RefreshTokenStore refreshTokenStore
    ) {
        this.userRepository = userRepository;
        this.localStorageService = localStorageService;
        this.refreshTokenStore = refreshTokenStore;
    }

    @Transactional
    public Map<String, Object> deleteAccount(UUID userId, String confirm) {
        if (!"DELETE".equals(confirm)) {
            throw new IllegalArgumentException("DELETE_CONFIRM_REQUIRED");
        }
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("USER_NOT_FOUND");
        }

        try {
            localStorageService.deleteUserData(userId);
        } catch (IOException ex) {
            throw new IllegalArgumentException("ACCOUNT_DELETE_FAILED");
        }

        refreshTokenStore.revokeAllForUser(userId);
        userRepository.deleteById(userId);
        return Map.of("deleted", true, "userId", userId.toString());
    }
}
