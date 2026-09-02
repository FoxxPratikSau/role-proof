/**
 * Local storage utilities for RoleProof.
 *
 * AI provider keys and preferences are stored in browser localStorage.
 * The master-resume key remains only for backward-compatible migration to
 * PostgreSQL. AI provider calls still go directly from the browser.
 */

import type { Provider } from "@/types";

const KEYS = {
  // Generic key retained only for migration from early single-provider releases.
  apiKey: "roleproof_api_key",
  // Per-provider keys
  provider: "roleproof_provider",
  apiKey_deepseek: "roleproof_api_key_deepseek",
  apiKey_openai: "roleproof_api_key_openai",
  apiKey_anthropic: "roleproof_api_key_anthropic",
  apiKey_google: "roleproof_api_key_google",
  apiKey_openrouter: "roleproof_api_key_openrouter",
  model: "roleproof_model",
  extractionJson: "roleproof_extraction_json",
  preferences: "roleproof_preferences",
} as const;

const LEGACY_KEYS = {
  apiKey: "rolecraft_api_key",
  provider: "rolecraft_provider",
  apiKey_deepseek: "rolecraft_api_key_deepseek",
  apiKey_openai: "rolecraft_api_key_openai",
  apiKey_anthropic: "rolecraft_api_key_anthropic",
  apiKey_google: "rolecraft_api_key_google",
  apiKey_openrouter: "rolecraft_api_key_openrouter",
  model: "rolecraft_model",
  extractionJson: "rolecraft_extraction_json",
  preferences: "rolecraft_preferences",
} as const;

const API_KEY_KEYS: Record<Provider, string> = {
  deepseek: KEYS.apiKey_deepseek,
  openai: KEYS.apiKey_openai,
  anthropic: KEYS.apiKey_anthropic,
  google: KEYS.apiKey_google,
  openrouter: KEYS.apiKey_openrouter,
};

const LEGACY_API_KEY_KEYS: Record<Provider, string> = {
  deepseek: LEGACY_KEYS.apiKey_deepseek,
  openai: LEGACY_KEYS.apiKey_openai,
  anthropic: LEGACY_KEYS.apiKey_anthropic,
  google: LEGACY_KEYS.apiKey_google,
  openrouter: LEGACY_KEYS.apiKey_openrouter,
};

export interface ActiveAIConfig {
  provider: Provider;
  model: string;
  apiKey: string | null;
}

const readStoredValue = (key: string, legacyKey?: string): string | null => {
  try {
    const current = localStorage.getItem(key);
    if (current !== null || !legacyKey) return current;
    const legacy = localStorage.getItem(legacyKey);
    if (legacy !== null) {
      localStorage.setItem(key, legacy);
      localStorage.removeItem(legacyKey);
    }
    return legacy;
  } catch {
    return null;
  }
};

const writeStoredValue = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
};

const removeStoredValues = (...keys: string[]): void => {
  try {
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
};

// ─── Provider ─────────────────────────────────────────────────

export const getProvider = (): Provider => {
  if (typeof window === "undefined") return "deepseek";
  const stored = readStoredValue(KEYS.provider, LEGACY_KEYS.provider);
  if (
    stored === "deepseek" ||
    stored === "openai" ||
    stored === "anthropic" ||
    stored === "google" ||
    stored === "openrouter"
  ) {
    return stored;
  }
  return "deepseek";
};

export const setProvider = (provider: Provider): void => {
  writeStoredValue(KEYS.provider, provider);
};

// ─── API Key (per-provider + legacy compat) ───────────────────

export const getApiKey = (provider?: Provider): string | null => {
  if (typeof window === "undefined") return null;
  // If a specific provider is requested, read its per-provider key
  if (provider) {
    const providerKey = readStoredValue(
      API_KEY_KEYS[provider],
      LEGACY_API_KEY_KEYS[provider],
    );
    if (providerKey) return providerKey;
    // The generic key predates providers and therefore belongs to DeepSeek.
    if (provider === "deepseek") {
      const genericKey = readStoredValue(KEYS.apiKey, LEGACY_KEYS.apiKey);
      if (genericKey) {
        writeStoredValue(API_KEY_KEYS.deepseek, genericKey);
        removeStoredValues(KEYS.apiKey, LEGACY_KEYS.apiKey);
        return genericKey;
      }
    }
    return null;
  }
  // No provider specified: read currently-selected provider's key
  const currentProvider = getProvider();
  const perProviderKey = readStoredValue(
    API_KEY_KEYS[currentProvider],
    LEGACY_API_KEY_KEYS[currentProvider],
  );
  if (perProviderKey) return perProviderKey;
  // Backward compat: check legacy key and migrate it
  const legacyKey = readStoredValue(KEYS.apiKey, LEGACY_KEYS.apiKey);
  if (legacyKey) {
    // Migrate to deepseek (the only provider that existed before multi-provider)
    writeStoredValue(API_KEY_KEYS.deepseek, legacyKey);
    // Clear the legacy key so we don't keep migrating
    removeStoredValues(KEYS.apiKey, LEGACY_KEYS.apiKey);
    return legacyKey;
  }
  return null;
};

export const setApiKey = (key: string, provider?: Provider): void => {
  const p = provider ?? getProvider();
  writeStoredValue(API_KEY_KEYS[p], key);
  // Clear legacy key when using per-provider storage
  removeStoredValues(KEYS.apiKey, LEGACY_KEYS.apiKey);
};

// ─── Model ───────────────────────────────────────────────────

export const getModel = (): string => {
  if (typeof window === "undefined") return "deepseek-v4-pro";
  return readStoredValue(KEYS.model, LEGACY_KEYS.model) ?? "deepseek-v4-pro";
};

export const getActiveAIConfig = (): ActiveAIConfig => {
  const provider = getProvider();
  return {
    provider,
    model: getModel(),
    apiKey: getApiKey(provider),
  };
};

export const setModel = (model: string): void => {
  writeStoredValue(KEYS.model, model);
};

// ─── Raw Extraction JSON ──────────────────────────────────

export const getExtractionJson = (): Record<string, unknown> | null => {
  if (typeof window === "undefined") return null;
  const raw = readStoredValue(KEYS.extractionJson, LEGACY_KEYS.extractionJson);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const clearExtractionJson = (): void => {
  removeStoredValues(KEYS.extractionJson, LEGACY_KEYS.extractionJson);
};
