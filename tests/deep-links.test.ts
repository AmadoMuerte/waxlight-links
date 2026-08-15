import { describe, expect, it } from "vitest";

import {
  isValidModId,
  isValidServerAddress,
  modDeepLink,
  normalizeServerAddress,
  serverDeepLink,
} from "../src/lib/deep-links";

describe("mod deep links", () => {
  it("creates a deterministic Waxlight URI", () => {
    expect(modDeepLink("optimum")).toBe("waxlight://mod/optimum");
  });

  it.each(["../../etc/passwd", "javascript:alert(1)", "https://evil.example", "UPPERCASE", "a_"])(
    "rejects unsafe id %s",
    (id) => expect(isValidModId(id)).toBe(false),
  );
});

describe("server deep links", () => {
  it.each(["play.example.com", "play.example.com:42420", "127.0.0.1", "127.0.0.1:42420"])(
    "accepts %s",
    (address) => expect(isValidServerAddress(address)).toBe(true),
  );

  it.each([
    "",
    "https://evil.example",
    "javascript:alert(1)",
    "file:///etc/passwd",
    "../../etc/passwd",
  ])("rejects unsafe address %s", (address) => expect(isValidServerAddress(address)).toBe(false));

  it("encodes and normalizes an address for a round trip", () => {
    const address = "play.example.com:42420";
    const deepLink = serverDeepLink(address);
    expect(deepLink).toBe("waxlight://server/play.example.com%3A42420");
    expect(normalizeServerAddress(decodeURIComponent(deepLink.split("/").at(-1)!))).toBe(address);
  });
});
