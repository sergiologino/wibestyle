package ru.wibestyle.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.wibestyle.api.config.AuthProperties;
import ru.wibestyle.api.domain.DeviceFingerprintEntity;
import ru.wibestyle.api.domain.UserDeviceLinkEntity;
import ru.wibestyle.api.domain.UserDeviceLinkId;
import ru.wibestyle.api.repository.DeviceFingerprintRepository;
import ru.wibestyle.api.repository.UserDeviceLinkRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DeviceTrustService {

    private static final int TRIAL_GENERATIONS_PER_DEVICE = 3;

    private final DeviceFingerprintRepository deviceFingerprintRepository;
    private final UserDeviceLinkRepository userDeviceLinkRepository;
    private final AuthProperties authProperties;

    public DeviceTrustService(
            DeviceFingerprintRepository deviceFingerprintRepository,
            UserDeviceLinkRepository userDeviceLinkRepository,
            AuthProperties authProperties
    ) {
        this.deviceFingerprintRepository = deviceFingerprintRepository;
        this.userDeviceLinkRepository = userDeviceLinkRepository;
        this.authProperties = authProperties;
    }

    @Transactional
    public DeviceRegistrationResult recordAuthentication(UUID userId, String rawDeviceId, boolean newUser) {
        Optional<String> maybeHash = hashDeviceId(rawDeviceId);
        if (maybeHash.isEmpty()) {
            return DeviceRegistrationResult.empty();
        }

        String deviceHash = maybeHash.get();
        Instant now = Instant.now();
        DeviceFingerprintEntity device = deviceFingerprintRepository.findById(deviceHash)
                .orElseGet(() -> new DeviceFingerprintEntity(deviceHash, now));
        boolean seenBefore = device.getRegistrationCount() > 0 || device.getDeletedAccountCount() > 0;
        device.setLastSeenAt(now);
        if (newUser) {
            device.recordRegistration(now);
        }
        deviceFingerprintRepository.save(device);

        UserDeviceLinkId linkId = new UserDeviceLinkId(userId, deviceHash);
        UserDeviceLinkEntity link = userDeviceLinkRepository.findById(linkId)
                .orElseGet(() -> new UserDeviceLinkEntity(userId, deviceHash, now));
        link.setLastSeenAt(now);
        userDeviceLinkRepository.save(link);

        return new DeviceRegistrationResult(
                deviceHash,
                seenBefore && newUser,
                device.getRegistrationCount(),
                device.getDeletedAccountCount(),
                device.getLastAccountDeletedAt()
        );
    }

    @Transactional(readOnly = true)
    public int availableTrialGenerations(UUID userId, String rawDeviceId) {
        Optional<DeviceFingerprintEntity> device = resolveDevice(userId, rawDeviceId);
        if (device.isEmpty()) {
            return TRIAL_GENERATIONS_PER_DEVICE;
        }
        return Math.max(0, TRIAL_GENERATIONS_PER_DEVICE - device.get().getTrialGenerationsUsed());
    }

    @Transactional(readOnly = true)
    public Optional<String> resolveDeviceHash(UUID userId, String rawDeviceId) {
        Optional<String> explicitHash = hashDeviceId(rawDeviceId);
        if (explicitHash.isPresent()) {
            return explicitHash;
        }
        return userDeviceLinkRepository.findByUserId(userId).stream()
                .findFirst()
                .map(UserDeviceLinkEntity::getDeviceHash);
    }

    @Transactional
    public void consumeTrialGeneration(UUID userId, String rawDeviceId) {
        Optional<DeviceFingerprintEntity> device = resolveDevice(userId, rawDeviceId);
        if (device.isEmpty()) {
            return;
        }
        device.get().consumeTrialGeneration(Instant.now());
        deviceFingerprintRepository.save(device.get());
    }

    @Transactional
    public void consumeTrialGenerationByHash(String deviceHash) {
        if (deviceHash == null || deviceHash.isBlank()) {
            return;
        }
        deviceFingerprintRepository.findById(deviceHash).ifPresent(device -> {
            device.consumeTrialGeneration(Instant.now());
            deviceFingerprintRepository.save(device);
        });
    }

    @Transactional
    public void recordAccountDeletion(UUID userId) {
        Instant now = Instant.now();
        List<UserDeviceLinkEntity> links = userDeviceLinkRepository.findByUserId(userId);
        for (UserDeviceLinkEntity link : links) {
            deviceFingerprintRepository.findById(link.getDeviceHash()).ifPresent(device -> {
                device.recordDeletion(now);
                deviceFingerprintRepository.save(device);
            });
        }
    }

    @Transactional(readOnly = true)
    public List<DeviceAdminRecord> listAdminDevices(UUID userId) {
        return userDeviceLinkRepository.findByUserId(userId).stream()
                .flatMap(link -> deviceFingerprintRepository.findById(link.getDeviceHash()).stream()
                        .map(device -> new DeviceAdminRecord(
                                link.getDeviceHash(),
                                link.getFirstSeenAt(),
                                link.getLastSeenAt(),
                                device.getFirstSeenAt(),
                                device.getLastSeenAt(),
                                device.getRegistrationCount(),
                                device.getDeletedAccountCount(),
                                device.getLastAccountDeletedAt(),
                                device.getTrialGenerationsUsed(),
                                Math.max(0, TRIAL_GENERATIONS_PER_DEVICE - device.getTrialGenerationsUsed())
                        )))
                .toList();
    }

    private Optional<DeviceFingerprintEntity> resolveDevice(UUID userId, String rawDeviceId) {
        Optional<String> explicitHash = hashDeviceId(rawDeviceId);
        if (explicitHash.isPresent()) {
            return deviceFingerprintRepository.findById(explicitHash.get());
        }
        return userDeviceLinkRepository.findByUserId(userId).stream()
                .findFirst()
                .flatMap(link -> deviceFingerprintRepository.findById(link.getDeviceHash()));
    }

    private Optional<String> hashDeviceId(String rawDeviceId) {
        if (rawDeviceId == null || rawDeviceId.isBlank()) {
            return Optional.empty();
        }
        String normalized = rawDeviceId.trim();
        if (normalized.length() < 16 || normalized.length() > 160) {
            return Optional.empty();
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String salted = authProperties.getJwtSecret() + ":" + normalized;
            return Optional.of(HexFormat.of().formatHex(digest.digest(salted.getBytes(StandardCharsets.UTF_8))));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    public record DeviceRegistrationResult(
            String deviceHash,
            boolean previousRegistrationOnDevice,
            int registrationCount,
            int deletedAccountCount,
            Instant lastAccountDeletedAt
    ) {
        static DeviceRegistrationResult empty() {
            return new DeviceRegistrationResult(null, false, 0, 0, null);
        }
    }

    public record DeviceAdminRecord(
            String deviceHash,
            Instant userFirstSeenAt,
            Instant userLastSeenAt,
            Instant deviceFirstSeenAt,
            Instant deviceLastSeenAt,
            int registrationCount,
            int deletedAccountCount,
            Instant lastAccountDeletedAt,
            int trialGenerationsUsed,
            int trialGenerationsLeft
    ) {
    }
}
