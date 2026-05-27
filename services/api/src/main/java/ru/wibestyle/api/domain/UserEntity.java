package ru.wibestyle.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    private UUID id;

    @Column(unique = true, length = 32)
    private String phone;

    @Column(unique = true)
    private String email;

    @Column(unique = true, length = 64)
    private String login;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(nullable = false, length = 32)
    private String status = "active";

    @Column(name = "primary_auth", nullable = false, length = 32)
    private String primaryAuth = "phone";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected UserEntity() {
    }

    public UserEntity(UUID id, String phone, Instant createdAt) {
        this.id = id;
        this.phone = phone;
        this.createdAt = createdAt;
        this.primaryAuth = "phone";
    }

    public static UserEntity createWithPassword(UUID id, String login, String email, String passwordHash, Instant createdAt) {
        UserEntity user = new UserEntity();
        user.id = id;
        user.login = login;
        user.email = email;
        user.passwordHash = passwordHash;
        user.createdAt = createdAt;
        user.primaryAuth = "password";
        user.status = "active";
        return user;
    }

    public static UserEntity createWithOAuth(UUID id, String email, String provider, Instant createdAt) {
        UserEntity user = new UserEntity();
        user.id = id;
        user.email = email;
        user.createdAt = createdAt;
        user.primaryAuth = provider;
        user.status = "active";
        return user;
    }

    public UUID getId() {
        return id;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public String getLogin() {
        return login;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getStatus() {
        return status;
    }

    public String getPrimaryAuth() {
        return primaryAuth;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }
}
