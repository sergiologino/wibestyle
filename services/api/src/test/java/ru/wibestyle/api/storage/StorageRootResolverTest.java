package ru.wibestyle.api.storage;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class StorageRootResolverTest {

    @TempDir
    Path tempDir;

    private String previousUserDir;
    private String previousStorageEnv;

    @BeforeEach
    void isolateUserDir() throws Exception {
        previousUserDir = System.getProperty("user.dir");
        previousStorageEnv = System.getenv("WIBESTYLE_STORAGE_ROOT");
        System.setProperty("user.dir", tempDir.toString());
        Files.createDirectories(tempDir.resolve("data/storage"));
        Files.writeString(tempDir.resolve("data/storage/.gitkeep"), "");
    }

    @AfterEach
    void restoreUserDir() {
        if (previousUserDir != null) {
            System.setProperty("user.dir", previousUserDir);
        }
    }

    @Test
    void resolvesMonorepoStorageFromGitkeepMarker() {
        Path resolved = StorageRootResolver.resolveRoot("../../data/storage");
        assertThat(resolved).isEqualTo(tempDir.resolve("data/storage").toAbsolutePath().normalize());
    }

    @Test
    void ignoresLegacyApiRelativePathWhenMonorepoMarkerExists() throws Exception {
        Path apiModule = tempDir.resolve("services/api");
        Files.createDirectories(apiModule.resolve("data/storage"));
        System.setProperty("user.dir", apiModule.toString());

        Path resolved = StorageRootResolver.resolveRoot("data/storage");
        assertThat(resolved).isEqualTo(tempDir.resolve("data/storage").toAbsolutePath().normalize());
    }

    @Test
    void usesHomeDirectoryWhenConfiguredBlankAndNoMonorepoData() throws Exception {
        Files.delete(tempDir.resolve("data/storage/.gitkeep"));
        Path resolved = StorageRootResolver.resolveRoot("");
        assertThat(resolved).isEqualTo(
                Path.of(System.getProperty("user.home"), ".wibestyle", "storage").toAbsolutePath().normalize()
        );
    }
}
