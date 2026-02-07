import {
  BarChart3,
  Check,
  Clock,
  Database,
  MousePointerClick,
  RefreshCw,
  Settings as SettingsIcon,
  Shield,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { DEFAULT_SETTINGS, type Settings } from '../../lib/settings';
import { getSettings, updateSettings } from '../../lib/storage';

const steps = [
  {
    icon: Database,
    title: 'Your data stays on your device',
    description:
      'Everything Anicite collects is stored locally in your browser. No servers, no accounts, no data leaving your machine.',
  },
  {
    icon: BarChart3,
    title: 'Rich insights with breakdowns',
    description:
      'Track time spent, page visits, clicks, scroll patterns, and sessions. See patterns with heatmaps and category breakdowns.',
  },
  {
    icon: SettingsIcon,
    title: 'You control everything',
    description:
      'Pause tracking anytime. Exclude sensitive sites. Export or delete your data. Your browsing, your rules.',
  },
] as const;

function AniciteIcon({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="1024" height="1024" rx="225" fill="#1E1B4B" />
      <path
        d="M303.82 774L466.26 312.1H556.78L719.22 774H641.1L605.76 670.46H417.9L381.94 774H303.82ZM438.98 605.36H583.44L501.6 363.56H522.06L438.98 605.36Z"
        fill="white"
      />
    </svg>
  );
}

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
          <div className="relative mx-auto mb-8 inline-block">
            <AniciteIcon size={80} />
            <div className="bg-success absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full shadow-lg">
              <Check className="h-4 w-4 text-white" strokeWidth={3} />
            </div>
          </div>
          <h1 className="text-2xl font-semibold">You're all set</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Anicite is now tracking your browsing activity locally.
          </p>

          <div className="bg-muted/50 mx-auto mt-6 flex max-w-xs items-center gap-3 rounded-lg px-4 py-3">
            <RefreshCw className="text-muted-foreground h-4 w-4 shrink-0" />
            <p className="text-muted-foreground text-left text-xs">
              Refresh any tabs you had open before installing for tracking to
              begin.
            </p>
          </div>

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
  const StepIcon = step?.icon;

  return (
    <div className="bg-background text-foreground flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 inline-block">
            <AniciteIcon size={56} />
          </div>
          <h1 className="text-2xl font-semibold">Before you start</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            A quick overview of how Anicite works
          </p>
        </div>

        <div className="mb-6 flex justify-center gap-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-1.5 w-8 rounded-full transition-all ${
                index <= currentStep
                  ? 'bg-primary'
                  : 'bg-muted hover:bg-muted-foreground/30'
              }`}
              type="button"
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        <div className="card mb-6 min-h-[220px]">
          <div className="mb-4 flex items-center gap-3">
            {StepIcon && (
              <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <StepIcon className="text-primary h-5 w-5" />
              </div>
            )}
            <h2 className="text-lg font-semibold leading-tight">
              {step?.title}
            </h2>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {step?.description}
          </p>

          {currentStep === 1 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { icon: Clock, label: 'Time' },
                { icon: MousePointerClick, label: 'Clicks' },
                { icon: BarChart3, label: 'Visuals' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="bg-muted/50 flex flex-col items-center gap-1.5 rounded-lg py-3"
                >
                  <Icon className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-[11px]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {currentStep === 2 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { icon: Shield, label: 'Exclude sites' },
                { icon: Trash2, label: 'Clear data' },
                { icon: Database, label: 'Export data' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="bg-muted/50 flex flex-col items-center gap-1.5 rounded-lg py-3"
                >
                  <Icon className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-[11px]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <button
            className="btn btn-primary w-full"
            onClick={isLastStep ? handleAgree : handleNext}
            type="button"
          >
            {isLastStep ? "I understand, let's go" : 'Continue'}
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
