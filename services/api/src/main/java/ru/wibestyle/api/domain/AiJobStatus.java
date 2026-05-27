package ru.wibestyle.api.domain;

public enum AiJobStatus {
    CREATED,
    QUEUED,
    RUNNING,
    PROVIDER_FAILED,
    FALLBACK_RUNNING,
    SUCCEEDED,
    FAILED,
    CANCELLED,
    EXPIRED
}
