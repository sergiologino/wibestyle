package ru.wibestyle.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wibestyle.storage")
public class StorageProperties {

    private String root = "./data/storage";

    public String getRoot() {
        return root;
    }

    public void setRoot(String root) {
        this.root = root;
    }
}
