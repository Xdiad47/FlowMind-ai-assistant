// src/components/onboarding/StepApiKey.tsx
import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Loader2, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepApiKeyProps {
  onSaveKey: (provider: string, key: string) => Promise<void>;
  onChooseHosted: () => void;
  isSaving: boolean;
  error: string | null;
}

const PROVIDERS = [
  { id: 'openai',    label: 'OpenAI',  prefix: 'sk-',     hint: 'Starts with sk-' },
  { id: 'anthropic', label: 'Claude',  prefix: 'sk-ant-', hint: 'Starts with sk-ant-' },
  { id: 'gemini',    label: 'Gemini',  prefix: 'AIza',    hint: 'Starts with AIza' },
  { id: 'groq',      label: 'Groq',    prefix: 'gsk_',    hint: 'Starts with gsk_' },
];

function validateKeyFormat(provider: string, key: string): string | null {
  const current = PROVIDERS.find(p => p.id === provider);
  if (!current) return null;

  // Anthropic must be checked before OpenAI (both start with sk-)
  const orderedProviders = ['anthropic', 'openai', 'gemini', 'groq'].map(id => PROVIDERS.find(p => p.id === id)!);

  // Check if key matches a DIFFERENT provider's prefix
  for (const p of orderedProviders) {
    if (p.id === provider) continue;
    if (key.startsWith(p.prefix)) {
      return `This looks like a ${p.label} key. Switch to ${p.label} or paste a ${current.label} key.`;
    }
  }

  // Check key matches the selected provider's own prefix
  if (!key.startsWith(current.prefix)) {
    return `${current.label} keys must start with "${current.prefix}". Check your key or select the correct provider.`;
  }

  return null;
}

export function StepApiKey({ onSaveKey, onChooseHosted, isSaving, error }: StepApiKeyProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    const err = validateKeyFormat(selectedProvider, trimmed);
    if (err) { setValidationError(err); return; }
    setValidationError(null);
    onSaveKey(selectedProvider, trimmed);
  };

  const handleKeyChange = (val: string) => {
    setApiKey(val);
    if (validationError) setValidationError(null);
  };

  const handleProviderChange = (id: string) => {
    setSelectedProvider(id);
    if (validationError) setValidationError(null);
  };

  const displayError = validationError || error;

  return (
    <div className="max-w-4xl w-full mx-auto animate-in fade-in zoom-in-95">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">Power FlowMind's AI</h2>
        <p className="text-muted">Choose how you want to power your AI Chief of Staff.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option A - BYOK */}
        <div className="bg-surface border-2 border-primary rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            RECOMMENDED
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" /> Bring Your Own Key
            </h3>
            <p className="text-sm text-primary mt-1 font-medium">Free — pay only your API provider</p>
          </div>

          <div className="space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={cn(
                    "px-3 py-2 border rounded-lg text-sm font-medium transition-colors focus-visible-ring text-left",
                    selectedProvider === p.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-muted text-muted"
                  )}
                >
                  <span className="block">{p.label}</span>
                  <span className="block text-[10px] font-mono opacity-60">{p.hint}</span>
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder={`Paste your ${PROVIDERS.find(p => p.id === selectedProvider)?.label ?? ''} API key`}
                className={cn(
                  "w-full bg-surface-2 border rounded-xl px-4 py-3 pr-10 outline-none focus:ring-1 transition-all font-mono text-sm",
                  displayError ? "border-error focus:border-error focus:ring-error/30" : "border-border focus:border-primary focus:ring-primary"
                )}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary focus-visible-ring rounded"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {displayError && <p className="text-sm text-error">{displayError}</p>}

            <div className="flex items-center gap-1.5 text-xs text-muted mt-2">
              <Lock className="w-3 h-3 shrink-0" />
              <span>Your key is encrypted with AES-256 and never logged.</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!apiKey.trim() || isSaving}
            className="w-full mt-6 py-3 rounded-xl font-semibold bg-primary hover:bg-primary-hover text-white disabled:bg-primary/50 disabled:cursor-not-allowed transition-colors flex items-center justify-center focus-visible-ring shadow-md"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save & Continue"}
          </button>
        </div>

        {/* Option B - Hosted */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col opacity-90 hover:opacity-100 transition-opacity">
          <div className="mb-6">
            <h3 className="text-xl font-bold">Use FlowMind's AI</h3>
            <p className="text-sm text-muted mt-1 font-medium">₹999/month — no API key needed</p>
          </div>

          <div className="flex-1 space-y-4 text-sm text-muted">
            <p>We handle the AI for you. Powered by Gemini Flash.</p>
            <ul className="space-y-2 list-disc pl-5">
              <li>Zero configuration</li>
              <li>Unlimited actions included</li>
              <li>Priority support</li>
            </ul>
          </div>

          <button
            onClick={onChooseHosted}
            disabled={isSaving}
            className="w-full mt-6 py-3 rounded-xl font-semibold bg-surface-2 hover:bg-surface-offset text-text-primary border border-border transition-colors focus-visible-ring"
          >
            Choose Hosted Plan
          </button>
        </div>
      </div>
    </div>
  );
}
