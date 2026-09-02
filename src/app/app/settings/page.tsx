"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select as AuthoredSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  getApiKey,
  setApiKey,
  getModel,
  setModel,
  getProvider,
  setProvider,
} from "@/lib/storage";
import {
  createChatCompletion,
  PROVIDER_CONFIGS,
  getDefaultModel,
} from "@/lib/ai";
import type { Provider } from "@/types";

const SettingsPage = () => {
  const router = useRouter();
  const [provider, setProviderState] = useState<Provider>("deepseek");
  const [apiKey, setApiKeyState] = useState("");
  const [model, setModelState] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  // Load stored settings on client only to avoid hydration mismatch
  useEffect(() => {
    const storedProvider = getProvider();
    const storedModel = getModel();
    const availableModels = PROVIDER_CONFIGS[storedProvider].models;
    const validModel = availableModels.some(
      (option) => option.value === storedModel,
    )
      ? storedModel
      : getDefaultModel(storedProvider);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProviderState(storedProvider);
    setApiKeyState(getApiKey(storedProvider) ?? "");
    setModelState(validModel);
    if (validModel !== storedModel) setModel(validModel);
  }, []);
  const handleProviderChange = (value: string | null) => {
    if (!value) return;
    const p = value as Provider;
    setProviderState(p);
    setProvider(p);
    // Auto-select this provider's default model
    const defaultModel = getDefaultModel(p);
    setModelState(defaultModel);
    setModel(defaultModel);
    // Load this provider's stored API key
    setApiKeyState(getApiKey(p) ?? "");
  };
  const handleApiKeyChange = (value: string) => {
    setApiKeyState(value);
    setApiKey(value, provider);
  };
  const handleModelChange = (value: string | null) => {
    if (!value) return;
    setModelState(value);
    setModel(value);
  };
  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      toast.error("Enter an API key first");
      return;
    }
    setTesting(true);
    try {
      await createChatCompletion({
        provider,
        model: model || getDefaultModel(provider),
        apiKey: apiKey.trim(),
        messages: [{ role: "user", content: "Ping" }],
        maxTokens: 32,
        temperature: 0,
      });
      toast.success("Connection successful — API key is valid");
      router.push("/app");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Connection failed: ${message}`);
    } finally {
      setTesting(false);
    }
  };
  const models = PROVIDER_CONFIGS[provider].models;
  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
  return (
    <div className="flex flex-1 flex-col px-4 py-7 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-7 border-b pb-6">
          <p className="text-primary mb-2 font-mono text-[10px] font-medium tracking-[0.16em] uppercase">
            AI connection
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Settings
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6">
            Choose the model that powers resume extraction and tailoring. Your
            key is saved only in this browser.
          </p>
        </div>
        <Card className="w-full shadow-[0_12px_34px_rgba(23,32,51,0.06)]">
          <CardHeader className="border-b pb-4">
            <CardTitle>Provider and model</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 pt-1">
            {/* Provider selector */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="provider-select">AI Provider</Label>
              <AuthoredSelect
                value={provider}
                onValueChange={handleProviderChange}
              >
                <SelectTrigger id="provider-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(PROVIDER_CONFIGS).map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="capitalize">{p}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </AuthoredSelect>
            </div>

            {/* API key */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="api-key">
                API key
                <span className="text-muted-foreground ml-1 text-xs">
                  ({providerLabel})
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showKey ? "text" : "password"}
                  placeholder={
                    provider === "deepseek" ? "sk-..." : "Enter your API key"
                  }
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  className="pr-11 font-mono"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/30 absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  aria-label={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              <p className="text-muted-foreground text-xs">
                Your key is stored locally in your browser. Nothing leaves your
                machine except direct API calls to the provider.
              </p>
            </div>

            {/* Model selector (dynamic per provider) */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="model-select">Model</Label>
              <AuthoredSelect value={model} onValueChange={handleModelChange}>
                <SelectTrigger id="model-select" className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </AuthoredSelect>
              <p className="text-muted-foreground text-xs">
                {models.find((o) => o.value === model)?.desc ??
                  "Select a model to see its description"}
              </p>
            </div>

            <Separator />

            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 size-4" />
              )}
              Test connection
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
