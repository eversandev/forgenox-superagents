import expertCatalogPtBr from "../locales/expert-catalog.pt-BR.json";
import type { UiLocale } from "./locale";

const expertCatalogTranslations = new Map(Object.entries(expertCatalogPtBr));

export interface LocalizedText {
  zh?: string;
  en?: string;
  "pt-BR"?: string;
}

/** Pick the best string for the active UI locale, with cross-locale fallback. */
export function pickLocale(
  node: LocalizedText | undefined,
  locale: UiLocale,
  options?: { crossFallback?: boolean },
): string {
  if (!node) return "";
  const crossFallback = options?.crossFallback !== false;
  if (locale === "pt-BR") {
    if (node["pt-BR"]) return node["pt-BR"];
    const translated = node.en
      ? expertCatalogTranslations.get(node.en)
      : undefined;
    if (translated) return translated;
  }
  if (locale === "zh") {
    if (node.zh) return node.zh;
    return crossFallback ? node.en || "" : "";
  }
  if (node.en) return node.en;
  return crossFallback ? node.zh || "" : "";
}
