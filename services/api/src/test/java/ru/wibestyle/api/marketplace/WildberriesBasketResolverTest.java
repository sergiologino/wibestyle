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
        assertEquals(40, hosts.size());
    }

    @Test
    void heuristicBasketNumberMatchesResolveBasketHost() {
        assertEquals(39, WildberriesBasketResolver.heuristicBasketNumber(7457));
        assertEquals(35, WildberriesBasketResolver.heuristicBasketNumber(6725));
        assertEquals(14, WildberriesBasketResolver.heuristicBasketNumber(2082));
    }
}
