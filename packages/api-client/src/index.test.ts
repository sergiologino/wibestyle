import { describe, expect, it, vi } from "vitest";
import { ApiError, WibeStyleApiClient } from "./index";

describe("WibeStyleApiClient", () => {
  it("calls health endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok", service: "wibestyle-api" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new WibeStyleApiClient({ baseUrl: "http://localhost:8080" });
    const result = await client.health();

    expect(result.status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/health",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );

    vi.unstubAllGlobals();
  });

  it("throws ApiError on failed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: "Bad phone", code: "INVALID_PHONE" }),
      }),
    );

    const client = new WibeStyleApiClient({ baseUrl: "http://localhost:8080" });

    await expect(client.startOtp("bad")).rejects.toBeInstanceOf(ApiError);

    vi.unstubAllGlobals();
  });

  it("sends only the URL when marketplace share text is pasted", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ product: {} }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new WibeStyleApiClient({ baseUrl: "http://localhost:8080" });
    await client.parseLink(
      "Летний костюм https://www.wildberries.ru/catalog/755269515/detail.aspx?targetUrl=SN",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/marketplaces/parse-link",
      expect.objectContaining({
        body: JSON.stringify({
          url: "https://www.wildberries.ru/catalog/755269515/detail.aspx?targetUrl=SN",
        }),
      }),
    );

    vi.unstubAllGlobals();
  });
});
