package ru.wibestyle.api.storage;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class StorageRootResolverTest {

    @TempDir
    Path tempDir;

    private String previousUserDir;
    private String previousStorageEnv;

    @BeforeEach
    void isolateUserDir() {
        previousUserDir = System.getProperty("user.dir");
        previousStorageEnv = System.getenv("WIBESTYLE_STORAGE_ROOT");
        System.setProperty("user.dir", tempDir.toString());
    }

    @AfterEach
    void restoreUserDir() {
        if (previousUserDir != null) {
            System.setProperty("user.dir", previousUserDir);
        }
    }

    @Test
    void resolvesRelativeConfiguredRootFromWorkingDirectory() {
        Path resolved = StorageRootResolver.resolveRoot("../../data/storage");
        Path expected = tempDir.resolve("../../data/storage").normalize().toAbsolutePath();
        assertThat(resolved).isEqualTo(expected);
    }

    @Test
    void usesHomeDirectoryWhenConfiguredBlankAndNoMonorepoData() {
        Path resolved = StorageRootResolver.resolveRoot("");
        assertThat(resolved).isEqualTo(
                Path.of(System.getProperty("user.home"), ".wibestyle", "storage").toAbsolutePath().normalize()
        );
    }
}
