package ru.wibestyle.api.marketplace;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class WildberriesSizeExtractorTest {

    @Test
    void extractsCombinedTechAndRussianSizesFromProductPage() {
        String html = """
                <div class="product-page">
                  <div class="productPageContent">
                    <div class="mainWrap">
                      <div class="sizesWrap">
                        <ul class="sizesList">
                          <li class="sizesListItem--abc">
                            <button>
                              <span class="mo-typography sizesListSize--szlpp">S</span>
                              <span class="mo-typography sizesListSizeRu--hqYsT">42</span>
                            </button>
                          </li>
                          <li class="sizesListItem--def">
                            <button>
                              <span class="mo-typography sizesListSize--szlpp">M</span>
                              <span class="mo-typography sizesListSizeRu--hqYsT">44</span>
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                """;

        assertThat(WildberriesSizeExtractor.extractSizes(html)).containsExactly("S / 42", "M / 44");
    }
}
