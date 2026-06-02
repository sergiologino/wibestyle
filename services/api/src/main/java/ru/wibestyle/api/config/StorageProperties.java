package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.storage")
public class StorageProperties {

    /** local = filesystem volume; s3 = planned (Coolify / object storage). */
    private String backend = "local";

    /** Root directory for local backend; blank = auto-detect monorepo `data/storage`. */
    private String root = "";

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
