package ru.wibestyle.api.storage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import ru.wibestyle.api.config.StorageProperties;

import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalBlobStorageTest {

    @TempDir
    Path tempDir;

    @Test
    void storesObjectKeysUnderConfiguredRoot() throws Exception {
        LocalBlobStorage storage = storageAt(tempDir);

        String key = storage.put("user-1/try-on/session-1/after.jpg", new ByteArrayInputStream("ok".getBytes()));

        assertThat(key).isEqualTo("user-1/try-on/session-1/after.jpg");
        assertThat(Files.readString(tempDir.resolve(key))).isEqualTo("ok");
    }

    @Test
    void rejectsAbsoluteAndTraversalKeysForNewWrites() throws Exception {
        LocalBlobStorage storage = storageAt(tempDir);

        assertThatThrownBy(() -> storage.put("../outside.jpg", new ByteArrayInputStream(new byte[] {1})))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("STORAGE_KEY_OUTSIDE_ROOT");
        assertThatThrownBy(() -> storage.put(tempDir.resolve("absolute.jpg").toString(), new ByteArrayInputStream(new byte[] {1})))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("STORAGE_KEY_MUST_BE_RELATIVE");
    }

    @Test
    void keepsLegacyAbsolutePathReadable() throws Exception {
        LocalBlobStorage storage = storageAt(tempDir);
        Path legacy = tempDir.resolve("legacy.jpg");
        Files.writeString(legacy, "legacy");

        assertThat(storage.readBytes(legacy.toString())).isEqualTo("legacy".getBytes());
    }

    private LocalBlobStorage storageAt(Path root) throws Exception {
        StorageProperties properties = new StorageProperties();
        properties.setRoot(root.toString());
        LocalBlobStorage storage = new LocalBlobStorage(properties);
        storage.init();
        return storage;
    }
}
