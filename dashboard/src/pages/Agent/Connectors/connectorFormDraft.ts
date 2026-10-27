import { loadFormDraft, saveFormDraft } from "../../../utils/formDraft";

function metadataOnly(
  values: Record<string, unknown>,
): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const key of ["display_name", "description"]) {
    if (typeof values[key] === "string") safe[key] = values[key];
  }
  if (typeof values.default_open === "boolean")
    safe.default_open = values.default_open;
  return safe;
}

export function saveConnectorDraft(
  scope: string,
  values: Record<string, unknown>,
): void {
  saveFormDraft(scope, metadataOnly(values));
}

export function loadConnectorDraft(
  scope: string,
): Record<string, unknown> | null {
  const draft = loadFormDraft(scope);
  if (!draft) return null;
  const safe = metadataOnly(draft);
  // Remove credential fields from legacy drafts before restoring the metadata.
  saveFormDraft(scope, safe);
  return safe;
}
