import { afterEach, describe, expect, it, vi } from "vitest";
import {
  detectBrowserLocale,
  readStoredUiLocale,
  resolveInitialLocale,
  speechLocaleFromUi,
  storeUiLocale,
  UI_LOCALE_STORAGE_KEY,
  normalizeUiLocale,
  syncDocumentLang,
} from "./localePrefs";

describe("localePrefs", () => {
  it("detects, stores and restores Brazilian Portuguese", () => {
    vi.stubGlobal("navigator", {
      language: "pt-BR",
      languages: ["pt-BR", "en"],
    });
    expect(detectBrowserLocale()).toBe("pt-BR");
    expect(normalizeUiLocale("pt_br")).toBe("pt-BR");
    storeUiLocale("pt-BR");
    expect(resolveInitialLocale()).toBe("pt-BR");
    expect(readStoredUiLocale()).toBe("pt-BR");
    expect(speechLocaleFromUi("pt-BR")).toBe("pt-BR");
    syncDocumentLang("pt-BR");
    expect(document.documentElement.lang).toBe("pt-BR");
    syncDocumentLang("en");
  });
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("detectBrowserLocale prefers zh when browser lists Chinese first", () => {
    vi.stubGlobal("navigator", {
      language: "en-US",
      languages: ["zh-CN", "en-US"],
    });
    expect(detectBrowserLocale()).toBe("zh");
  });

  it("detectBrowserLocale prefers en when browser lists English first", () => {
    vi.stubGlobal("navigator", {
      language: "zh-CN",
      languages: ["en-US", "zh-CN"],
    });
    expect(detectBrowserLocale()).toBe("en");
  });

  it("resolveInitialLocale uses stored preference over browser", () => {
    vi.stubGlobal("navigator", {
      language: "en-US",
      languages: ["en-US"],
    });
    storeUiLocale("zh");
    expect(resolveInitialLocale()).toBe("zh");
    expect(readStoredUiLocale()).toBe("zh");
    localStorage.removeItem(UI_LOCALE_STORAGE_KEY);
    expect(resolveInitialLocale()).toBe("en");
  });

  it("speechLocaleFromUi maps UI locale to STT BCP-47 tags", () => {
    expect(speechLocaleFromUi("zh")).toBe("zh-CN");
    expect(speechLocaleFromUi("zh-CN")).toBe("zh-CN");
    expect(speechLocaleFromUi("en")).toBe("en-US");
    expect(speechLocaleFromUi("en-US")).toBe("en-US");
    expect(speechLocaleFromUi(null)).toBe("zh-CN");
  });
});
