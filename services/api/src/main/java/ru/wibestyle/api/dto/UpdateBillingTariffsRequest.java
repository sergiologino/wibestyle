package ru.wibestyle.api.dto;

public record UpdateBillingTariffsRequest(
        Integer tryon20PriceRub,
        Integer tryon50PriceRub,
        Integer tryon100PriceRub
) {
}
