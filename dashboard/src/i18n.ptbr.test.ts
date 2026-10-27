import { afterEach, expect, it, vi } from "vitest";
import i18n, { ensureLocaleBundle, initI18n } from "./i18n";
import { storeUiLocale } from "./utils/localePrefs";

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

it("loads Brazilian Portuguese and switches back to English using the actual bundles", async () => {
  storeUiLocale("pt-BR");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ setup_required: true }),
    }),
  );
  await initI18n();
  expect(i18n.language).toBe("pt-BR");
  expect(i18n.t("login.registration.open")).toBe("Criar conta");
  expect(i18n.t("nav.adminUsers")).toBe("Usuários");
  await ensureLocaleBundle("en");
  await i18n.changeLanguage("en");
  expect(i18n.t("login.registration.open")).toBe("Create account");
});
