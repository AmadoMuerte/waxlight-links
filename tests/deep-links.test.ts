import { describe, expect, it } from "vitest";

import { isValidModId, modDeepLink } from "../src/lib/deep-links";

describe("mod deep links", () => {
  it("creates a deterministic Waxlight URI", () => {
    expect(modDeepLink("optimum")).toBe("waxlight://mod/optimum");
  });

  it.each(["../../etc/passwd", "javascript:alert(1)", "https://evil.example", "UPPERCASE", "a_"])(
    "rejects unsafe id %s",
    (id) => expect(isValidModId(id)).toBe(false),
  );
});
