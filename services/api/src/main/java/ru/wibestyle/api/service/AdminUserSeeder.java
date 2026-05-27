package ru.wibestyle.api.service;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import ru.wibestyle.api.config.AdminProperties;
import ru.wibestyle.api.domain.AdminRole;
import ru.wibestyle.api.domain.AdminUserEntity;
import ru.wibestyle.api.repository.AdminUserRepository;

import java.time.Instant;
import java.util.UUID;

@Component
public class AdminUserSeeder {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminProperties adminProperties;

    public AdminUserSeeder(
            AdminUserRepository adminUserRepository,
            PasswordEncoder passwordEncoder,
            AdminProperties adminProperties
    ) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminProperties = adminProperties;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seedDefaultAdmin() {
        if (adminUserRepository.count() > 0) {
            return;
        }
        Instant now = Instant.now();
        adminUserRepository.save(new AdminUserEntity(
                UUID.randomUUID(),
                "admin@wibestyle.local",
                "Dev Admin",
                passwordEncoder.encode(adminProperties.getBootstrapPassword()),
                AdminRole.SUPER_ADMIN,
                now
        ));
    }
}
