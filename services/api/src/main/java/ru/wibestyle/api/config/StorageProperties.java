package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.storage")
public class StorageProperties {

    /** local = filesystem volume; s3 = planned (Coolify / object storage). */
    private String backend = "local";

    /** Root directory for local backend (ignored when WIBESTYLE_STORAGE_ROOT is set). */
    private String root = "../../data/storage";

    public String getRoot() {
        return root;
    }

    public void setRoot(String root) {
        this.root = root;
    }

    public String getBackend() {
        return backend;
    }

    public void setBackend(String backend) {
        this.backend = backend;
    }
}
