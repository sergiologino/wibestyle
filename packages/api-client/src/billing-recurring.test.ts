import { afterEach, describe, expect, it, vi } from "vitest";
import { WibeStyleApiClient } from "./index";

describe("recurring billing API", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends explicit save consent and mobile client marker", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ checkoutId: "c1" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const api = new WibeStyleApiClient({ baseUrl: "https://api.example", getAccessToken: () => "token" });

    await api.checkout("wibe", "annual", { savePaymentMethod: true, client: "mobile" });

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({
      plan: "wibe",
      period: "annual",
      savePaymentMethod: true,
      client: "mobile",
    });
  });

  it("uses authenticated endpoints for auto-renew and push devices", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const api = new WibeStyleApiClient({ baseUrl: "https://api.example", getAccessToken: () => "token" });

    await api.setAutoRenew(false);
    await api.registerPushDevice("ExponentPushToken[test]", "android");

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example/api/v1/billing/subscription/auto-renew");
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.example/api/v1/notifications/push-devices");
  });
});
