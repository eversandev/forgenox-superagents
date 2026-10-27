import { describe, expect, it } from "vitest";
import { pickLocale } from "./localizedText";
import catalog from "../locales/expert-catalog.pt-BR.json";

describe("localized expert catalog", () => {
  it("translates every curated catalog text only for Portuguese", () => {
    expect(Object.keys(catalog)).toHaveLength(108);
    for (const [en, pt] of Object.entries(catalog)) {
      expect(pickLocale({ en }, "pt-BR")).toBe(pt);
      expect(pickLocale({ en }, "en")).toBe(en);
    }
  });
  it("prefers explicit Portuguese and preserves unknown content", () => {
    expect(
      pickLocale(
        { en: "Tech Test Automation Expert", "pt-BR": "Meu texto" },
        "pt-BR",
      ),
    ).toBe("Meu texto");
    expect(pickLocale({ en: "constructor" }, "pt-BR")).toBe("constructor");
    expect(pickLocale({ en: "Custom user expert" }, "pt-BR")).toBe(
      "Custom user expert",
    );
    expect(pickLocale({ zh: "中文" }, "en", { crossFallback: false })).toBe("");
  });
});
