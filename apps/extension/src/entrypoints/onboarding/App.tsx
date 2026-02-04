import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

import { DEFAULT_SETTINGS, type Settings } from '../../lib/settings';
import { getSettings, updateSettings } from '../../lib/storage';

const steps = [
  {
    title: 'Your device, your data',
    description:
      'This extension only runs on devices you own or have permission to use. All data stays local.',
  },
  {
    title: 'What gets tracked',
    description:
      'We record page visits, active time, clicks, and scroll depth. We do not store query strings or fragments.',
  },
  {
    title: 'You are in control',
    description:
      'Pause tracking anytime, exclude specific sites, or clear all data. Nothing leaves your control.',
  },
] as const;

export function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [currentStep, setCurrentStep] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const isComplete =
    settings.onboarding.consentConfirmed &&
    settings.onboarding.privacyReviewed &&
    settings.onboarding.pinExtension;

  useEffect(() => {
    const init = async () => {
      const storedSettings = await getSettings();
      setSettings(storedSettings);
      setIsReady(true);
    };
    void init();
  }, []);

  const closePage = async () => {
    try {
      const tab = await chrome.tabs.getCurrent();
      if (tab?.id) {
        await chrome.tabs.remove(tab.id);
        return;
      }
    } catch {
      // fallback
    }
    window.close();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAgree = async () => {
    const next = await updateSettings({
      onboarding: {
        consentConfirmed: true,
        privacyReviewed: true,
        pinExtension: true,
      },
    });
    setSettings(next);
  };

  if (!isReady) {
    return null;
  }

  if (isComplete) {
    return (
      <div className="bg-background text-foreground flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-success/10 border-success/20 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border">
            <Check className="text-success h-8 w-8" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-semibold">You're all set</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Anicite is ready to track your browsing activity locally.
          </p>
          <button
            className="btn btn-primary mt-8 w-full"
            onClick={closePage}
            type="button"
          >
            Get started
          </button>
        </div>
      </div>
    );
  }

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="bg-background text-foreground flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-primary text-xs font-semibold uppercase tracking-widest">
            Anicite
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Before you start</h1>
        </div>

        <div className="mb-8 flex justify-center gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="card mb-6 min-h-[140px]">
          <h2 className="text-lg font-semibold">{step?.title}</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {step?.description}
          </p>
        </div>

        <div className="space-y-2">
          <button
            className="btn btn-primary w-full"
            onClick={isLastStep ? handleAgree : handleNext}
            type="button"
          >
            {isLastStep ? 'I understand' : 'Continue'}
          </button>
          <button
            className={`btn btn-ghost w-full ${currentStep === 0 ? 'pointer-events-none opacity-0' : ''}`}
            onClick={handleBack}
            type="button"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
