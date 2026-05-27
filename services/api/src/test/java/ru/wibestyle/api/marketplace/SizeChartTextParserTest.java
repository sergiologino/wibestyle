package ru.wibestyle.api.marketplace;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SizeChartTextParserTest {

    @Test
    void parsesTableLikeRows() {
        String text = """
                Размерная сетка
                S 84-88 64-68 90-94
                M 88-92 68-72 94-98
                L 92-96 72-76 98-102
                """;
        ProductSizeChart chart = SizeChartTextParser.parse("test", text);
        assertThat(chart.found()).isTrue();
        assertThat(chart.entries()).hasSize(3);
        assertThat(chart.entries().get(0).label()).isEqualTo("S");
        assertThat(chart.entries().get(0).bustMaxCm()).isEqualTo(88);
    }
}
