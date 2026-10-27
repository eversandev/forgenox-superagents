import { beforeEach, describe, expect, it } from "vitest";
import { draftStorageKey, saveFormDraft } from "../../../utils/formDraft";
import { loadConnectorDraft, saveConnectorDraft } from "./connectorFormDraft";

beforeEach(() => sessionStorage.clear());

describe("connector credential drafts", () => {
  it("keeps form metadata while excluding every credential field", () => {
    saveConnectorDraft("connector:new:composio-api", {
      display_name: "My project",
      description: "Apps",
      default_open: false,
      api_key: "private-test-key",
      password: "private-password",
      token: "private-token",
      future_secret: "private-future-key",
      credentials: { key: "private-nested" },
      user_id: "account",
    });
    const stored = sessionStorage.getItem(
      draftStorageKey("connector:new:composio-api"),
    )!;
    expect(JSON.parse(stored)).toEqual({
      display_name: "My project",
      description: "Apps",
      default_open: false,
    });
    expect(stored).not.toContain("private-");
  });
  it("removes credentials from legacy drafts before restoring fields", () => {
    const scope = "connector:new:composio-api";
    saveFormDraft(scope, {
      display_name: "Project",
      api_key: "old-private-key",
      user_id: "autofilled-account",
    });
    expect(loadConnectorDraft(scope)).toEqual({ display_name: "Project" });
    expect(sessionStorage.getItem(draftStorageKey(scope))).toBe(
      '{"display_name":"Project"}',
    );
  });
});
