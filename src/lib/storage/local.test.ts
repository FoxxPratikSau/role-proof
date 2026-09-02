import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getApiKey,
  getActiveAIConfig,
  getModel,
  getProvider,
  setApiKey,
  setModel,
  setProvider,
} from "./local";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("RoleProof local storage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", new MemoryStorage());
  });

  it("writes provider settings under the RoleProof namespace", () => {
    setProvider("openai");
    setModel("gpt-4o-mini");
    setApiKey("secret", "openai");

    expect(localStorage.getItem("roleproof_provider")).toBe("openai");
    expect(localStorage.getItem("roleproof_model")).toBe("gpt-4o-mini");
    expect(localStorage.getItem("roleproof_api_key_openai")).toBe("secret");
  });

  it("returns the active provider configuration together", () => {
    setProvider("openai");
    setModel("gpt-4o-mini");
    setApiKey("secret", "openai");

    expect(getActiveAIConfig()).toEqual({
      provider: "openai",
      model: "gpt-4o-mini",
      apiKey: "secret",
    });
  });

  it("migrates existing RoleCraft settings without losing them", () => {
    localStorage.setItem("rolecraft_provider", "anthropic");
    localStorage.setItem("rolecraft_model", "claude-sonnet-4-20250514");
    localStorage.setItem("rolecraft_api_key_anthropic", "legacy-secret");

    expect(getProvider()).toBe("anthropic");
    expect(getModel()).toBe("claude-sonnet-4-20250514");
    expect(getApiKey("anthropic")).toBe("legacy-secret");
    expect(localStorage.getItem("roleproof_provider")).toBe("anthropic");
    expect(localStorage.getItem("roleproof_model")).toBe(
      "claude-sonnet-4-20250514",
    );
    expect(localStorage.getItem("roleproof_api_key_anthropic")).toBe(
      "legacy-secret",
    );
    expect(localStorage.getItem("rolecraft_provider")).toBeNull();
  });

  it("migrates the original single-provider API key to DeepSeek", () => {
    localStorage.setItem("rolecraft_api_key", "original-secret");

    expect(getApiKey("deepseek")).toBe("original-secret");
    expect(localStorage.getItem("roleproof_api_key_deepseek")).toBe(
      "original-secret",
    );
    expect(localStorage.getItem("rolecraft_api_key")).toBeNull();
  });
});
