package ru.wibestyle.api.service;

public class MobileIdException extends RuntimeException {
    public MobileIdException(String code) { super(code); }
    public MobileIdException(String code, Throwable cause) { super(code, cause); }
}
