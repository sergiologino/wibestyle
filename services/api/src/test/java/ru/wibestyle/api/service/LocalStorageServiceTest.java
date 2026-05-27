package ru.wibestyle.api.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class LocalStorageServiceTest {

    @TempDir
    Path tempDir;

    private String previousUserDir;

    @BeforeEach
    void isolateUserDir() {
        previousUserDir = System.getProperty("user.dir");
        System.setProperty("user.dir", tempDir.toString());
    }

    @AfterEach
    void restoreUserDir() {
        if (previousUserDir != null) {
            System.setProperty("user.dir", previousUserDir);
        }
    }

    @Test
    void prefersExistingCwdDataStorage() throws Exception {
        Path cwdStorage = tempDir.resolve("data").resolve("storage");
        Files.createDirectories(cwdStorage);

        Path resolved = LocalStorageService.resolveStorageRoot("./data/storage");
        assertThat(resolved).isEqualTo(cwdStorage.toAbsolutePath().normalize());
    }

    @Test
    void usesHomeDirectoryWhenNoCwdStorage() {
        Path resolved = LocalStorageService.resolveStorageRoot("./data/storage");
        assertThat(resolved).isEqualTo(
                Path.of(System.getProperty("user.home"), ".wibestyle", "storage").toAbsolutePath().normalize()
        );
    }
}
