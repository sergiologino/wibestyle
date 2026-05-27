package ru.wibestyle.api.domain;

import java.util.EnumSet;
import java.util.Set;

public enum AdminRole {
    SUPER_ADMIN,
    MODERATOR,
    SUPPORT,
    MARKETING,
    AI_OPERATOR;

    public boolean canManageUsers() {
        return this == SUPER_ADMIN;
    }

    public boolean canImpersonate() {
        return this == SUPER_ADMIN;
    }

    public boolean canModerateContent() {
        return EnumSet.of(SUPER_ADMIN, MODERATOR).contains(this);
    }

    public boolean canViewAiLogs() {
        return EnumSet.of(SUPER_ADMIN, AI_OPERATOR, SUPPORT).contains(this);
    }

    public static AdminRole parse(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("ADMIN_ROLE_INVALID");
        }
        return AdminRole.valueOf(value.trim().toUpperCase());
    }

    public static Set<AdminRole> all() {
        return EnumSet.allOf(AdminRole.class);
    }
}
