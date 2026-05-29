package ru.wibestyle.api.domain;

public final class TryOnErrorCodes {

    private TryOnErrorCodes() {
    }

    public static final String PRODUCT_PARSE_FAILED = "PRODUCT_PARSE_FAILED";
    public static final String MARKETPLACE_UNSUPPORTED = "MARKETPLACE_UNSUPPORTED";
    public static final String PRODUCT_IMAGE_NOT_FOUND = "PRODUCT_IMAGE_NOT_FOUND";
    public static final String SIZE_NOT_AVAILABLE = "SIZE_NOT_AVAILABLE";
    public static final String AVATAR_NOT_READY = "AVATAR_NOT_READY";
    public static final String AI_PROVIDER_TIMEOUT = "AI_PROVIDER_TIMEOUT";
    public static final String AI_GENERATION_FAILED = "AI_GENERATION_FAILED";
    /** xAI content moderation blocked legitimate catalog try-on (sleepwear/homewear, etc.). */
    public static final String VTON_CONTENT_MODERATION = "VTON_CONTENT_MODERATION";
    public static final String INSUFFICIENT_GENERATIONS = "INSUFFICIENT_GENERATIONS";
    public static final String SESSION_NOT_FOUND = "SESSION_NOT_FOUND";
    public static final String VIDEO_ELITE_REQUIRED = "VIDEO_ELITE_REQUIRED";
    public static final String VIDEO_GENERATION_FAILED = "VIDEO_GENERATION_FAILED";
    public static final String PROFILE_GENDER_REQUIRED = "PROFILE_GENDER_REQUIRED";
}
