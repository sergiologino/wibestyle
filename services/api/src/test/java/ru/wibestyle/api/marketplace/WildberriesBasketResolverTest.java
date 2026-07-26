package ru.wibestyle.api.marketplace;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class WildberriesBasketResolverTest {

    @Test
    void orderedBasketHostsSpiralsFromHeuristicForVol7457() {
        List<String> hosts = WildberriesBasketResolver.orderedBasketHosts(7457);
        assertEquals("https://basket-39.wbbasket.ru", hosts.get(0));
        assertTrue(hosts.indexOf("https://basket-35.wbbasket.ru") < 10);
        assertEquals(WildberriesBasketResolver.DEFAULT_MAX_BASKET_NUMBER, hosts.size());
    }

    @Test
    void orderedBasketHostsIncludesNewHighBasketShards() {
        List<String> hosts = WildberriesBasketResolver.orderedBasketHosts(10214);

        assertTrue(hosts.indexOf("https://basket-41.wbbasket.ru") > 0);
        assertTrue(hosts.indexOf("https://basket-42.wbbasket.ru") > 0);
        assertTrue(hosts.indexOf("https://basket-41.wbbasket.ru") < 5);
        assertTrue(hosts.indexOf("https://basket-42.wbbasket.ru") < 7);
    }

    @Test
    void heuristicBasketNumberMatchesResolveBasketHost() {
        assertEquals(39, WildberriesBasketResolver.heuristicBasketNumber(7457));
        assertEquals(35, WildberriesBasketResolver.heuristicBasketNumber(6725));
        assertEquals(14, WildberriesBasketResolver.heuristicBasketNumber(2082));
    }
}
