import { afterEach, describe, expect, it, vi } from "vitest";

import { getDownloads } from "../src/lib/github";
import { getModMetadata } from "../src/lib/moddb";

afterEach(() => vi.restoreAllMocks());

describe("external API fallbacks", () => {
  it("keeps ModDB metadata optional", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(getModMetadata("network-test-mod")).resolves.toBeUndefined();
  });

  it("converts ModDB HTML descriptions to text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            statuscode: "200",
            mod: {
              name: "Test",
              text: "<p>Useful <strong>description</strong> &amp; details.</p>",
            },
          }),
        ),
      ),
    );

    await expect(getModMetadata("test-mod")).resolves.toMatchObject({
      summary: "Useful description & details.",
    });
  });

  it("falls back to the official release page", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const downloads = await getDownloads();
    expect(downloads.assets).toEqual([]);
    expect(downloads.latestUrl).toContain("AmadoMuerte/Waxlight-launcher/releases/latest");
  });
});
