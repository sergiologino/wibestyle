package ru.wibestyle.api.storage;

import java.nio.file.Files;
import java.nio.file.Path;

/** Resolves persistent media root — separate from API process / JAR directory. */
public final class StorageRootResolver {

    private static final String STORAGE_MARKER = "data/storage/.gitkeep";

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
            if (path.isAbsolute()) {
                return path.normalize();
            }
        }

        Path monorepoRoot = findMonorepoRoot();
        if (monorepoRoot != null) {
            return monorepoRoot.resolve("data/storage").toAbsolutePath().normalize();
        }

        if (!configured.isBlank()) {
            return Path.of(System.getProperty("user.dir"))
                    .resolve(configured)
                    .toAbsolutePath()
                    .normalize();
        }

        return Path.of(System.getProperty("user.home"), ".wibestyle", "storage")
                .toAbsolutePath()
                .normalize();
    }

    static Path findMonorepoRoot() {
        Path cursor = Path.of(System.getProperty("user.dir")).toAbsolutePath().normalize();
        for (int depth = 0; depth < 10 && cursor != null; depth++) {
            if (Files.isRegularFile(cursor.resolve(STORAGE_MARKER))) {
                return cursor;
            }
            cursor = cursor.getParent();
        }
        return null;
    }
}
