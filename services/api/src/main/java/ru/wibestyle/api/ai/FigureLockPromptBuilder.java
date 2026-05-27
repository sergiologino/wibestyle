package ru.wibestyle.api.ai;



import ru.wibestyle.api.domain.AvatarSnapshotEntity;

import ru.wibestyle.api.marketplace.ProductSizeChart;

import ru.wibestyle.api.marketplace.SizeChartEntry;



/**

 * Блок сохранения фигуры для промпта примерки (русский, уходит в JSON переменных).

 */

public final class FigureLockPromptBuilder {



    private FigureLockPromptBuilder() {

    }



    public static String build(AvatarSnapshotEntity snapshot, String selectedGarmentSize, ProductSizeChart sellerChart) {

        if (snapshot == null) {

            return "";

        }

        StringBuilder builder = new StringBuilder();

        builder.append("ФИГУРА (приоритет над биркой размера): image1 — эталон объёма тела. ");

        builder.append("Совпади с силуэтом на фото И с замерами пользователя: ");

        appendMetrics(builder, snapshot);

        builder.append("ЗАПРЕЩЕНО: уменьшать грудь, бёдра, утончать фигуру на 1–2 размера, ");

        builder.append("пропорции манекена каталога. ");

        if (snapshot.getBustCm() != null && snapshot.getBustCm() >= 94) {

            builder.append("Полная грудь (")

                    .append(snapshot.getBustCm())

                    .append(" см) — сохрани тот же объём и форму груди, что на image1. ");

        }

        if (selectedGarmentSize != null && !selectedGarmentSize.isBlank()) {

            builder.append("Бирка маркетплейса ").append(selectedGarmentSize)

                    .append(" не должна сужать тело — может быть тесная ткань, фигура остаётся прежней. ");

        }

        appendSellerChartHint(builder, selectedGarmentSize, sellerChart);

        builder.append("Повтор: грудь и бёдра как на image1 и в замерах.");

        return builder.toString().replaceAll("\\s+", " ").trim();

    }



    private static void appendMetrics(StringBuilder builder, AvatarSnapshotEntity snapshot) {

        if (snapshot.getHeightCm() != null) {

            builder.append("рост ").append(snapshot.getHeightCm()).append(" см, ");

        }

        if (snapshot.getBustCm() != null) {

            builder.append("грудь ").append(snapshot.getBustCm()).append(" см, ");

        }

        if (snapshot.getWaistCm() != null) {

            builder.append("талия ").append(snapshot.getWaistCm()).append(" см, ");

        }

        if (snapshot.getHipsCm() != null) {

            builder.append("бёдра ").append(snapshot.getHipsCm()).append(" см, ");

        }

        if (snapshot.getClothingSize() != null && !snapshot.getClothingSize().isBlank()) {

            builder.append("обычный размер одежды ").append(snapshot.getClothingSize().trim()).append(", ");

        }

    }



    private static void appendSellerChartHint(StringBuilder builder, String selectedSize, ProductSizeChart chart) {

        if (chart == null || !chart.found() || selectedSize == null) {

            return;

        }

        for (SizeChartEntry entry : chart.entries()) {

            if (!sizeLabelMatches(selectedSize, entry.label())) {

                continue;

            }

            if (entry.bustMaxCm() != null) {

                builder.append("В сетке продавца ").append(entry.label())

                        .append(" грудь до ").append(entry.bustMaxCm()).append(" см — ")

                        .append("на более полной фигуре вещь может сидеть в обтяжку, тело не уменьшать. ");

            }

            return;

        }

    }



    private static boolean sizeLabelMatches(String selected, String chartLabel) {

        if (selected == null || chartLabel == null) {

            return false;

        }

        return selected.trim().equalsIgnoreCase(chartLabel.trim());

    }

}


