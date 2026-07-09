package ru.wibestyle.api.domain;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class UserDeviceLinkId implements Serializable {
    private UUID userId;
    private String deviceHash;

    public UserDeviceLinkId() {
    }

    public UserDeviceLinkId(UUID userId, String deviceHash) {
        this.userId = userId;
        this.deviceHash = deviceHash;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof UserDeviceLinkId that)) return false;
        return Objects.equals(userId, that.userId) && Objects.equals(deviceHash, that.deviceHash);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, deviceHash);
    }
}
