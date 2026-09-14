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

  it("starts hairstyle try-on from a source session path and falls back to query endpoint on stale servers", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Not Found" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "hair-result-1",
          sourceSessionId: "session-1",
          beforeImageUrl: "/before.jpg",
          afterImageUrl: "/after.jpg",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const client = new WibeStyleApiClient({ baseUrl: "http://localhost:8080" });
    const result = await client.createHairstyleTryOnFromSession("session-1", "bob", "ruby");

    expect(result.id).toBe("hair-result-1");
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8080/api/v1/hairstyles/try-on/from-session/session-1?styleId=bob&colorId=ruby",
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:8080/api/v1/hairstyles/try-on/from-session?styleId=bob&colorId=ruby&sourceSessionId=session-1",
    );

    vi.unstubAllGlobals();
  });
});
