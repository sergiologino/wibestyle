package ru.wibestyle.api.storage;

import java.nio.file.Files;
import java.nio.file.Path;

/** Resolves persistent media root — separate from API process / JAR directory. */
public final class StorageRootResolver {

    private StorageRootResolver() {
    }

    public static Path resolveRoot(String configuredRoot) {
        String envOverride = System.getenv("WIBESTYLE_STORAGE_ROOT");
        if (envOverride != null && !envOverride.isBlank()) {
            return Path.of(envOverride).toAbsolutePath().normalize();
        }

        String configured = configuredRoot == null ? "" : configuredRoot.trim();
        if (!configured.isBlank()) {
            Path path = Path.of(configured);
            if (!path.isAbsolute()) {
                path = Path.of(System.getProperty("user.dir")).resolve(path);
            }
            return path.toAbsolutePath().normalize();
        }

        Path monorepoStorage = Path.of(System.getProperty("user.dir"))
                .resolve("../../data/storage")
                .normalize()
                .toAbsolutePath();
        if (Files.exists(monorepoStorage.getParent())) {
            return monorepoStorage;
        }

        Path cwdData = Path.of(System.getProperty("user.dir")).resolve("data").resolve("storage");
        if (Files.exists(cwdData)) {
            return cwdData.toAbsolutePath().normalize();
        }

        return Path.of(System.getProperty("user.home"), ".wibestyle", "storage").toAbsolutePath().normalize();
    }
}
