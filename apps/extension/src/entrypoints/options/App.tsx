import { useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_SETTINGS,
  normalizeHost,
  normalizeHostList,
  type Settings,
} from '../../lib/settings';
import { clearStore, getSettings, updateSettings } from '../../lib/storage';

export function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [newHost, setNewHost] = useState('');

  useEffect(() => {
    const init = async () => {
      const storedSettings = await getSettings();
      setSettings(storedSettings);
    };

    void init();
  }, []);

  const updateOnboarding = async (key: keyof Settings['onboarding']) => {
    const next = await updateSettings({
      onboarding: {
        ...settings.onboarding,
        [key]: !settings.onboarding[key],
      },
    });
    setSettings(next);
  };

  const addHost = async () => {
    const normalized = normalizeHost(newHost);
    if (!normalized) {
      return;
    }

    const next = await updateSettings({
      excludeHosts: normalizeHostList([...settings.excludeHosts, normalized]),
    });
    setSettings(next);
    setNewHost('');
  };

  const removeHost = async (host: string) => {
    const normalized = normalizeHost(host);
    const next = await updateSettings({
      excludeHosts: settings.excludeHosts.filter(
        (item) => normalizeHost(item) !== normalized
      ),
    });
    setSettings(next);
  };

  const clearData = async () => {
    if (
      !window.confirm('Delete all local tracking data? This cannot be undone.')
    ) {
      return;
    }

    await clearStore();
  };

  const onboardingProgress = useMemo(() => {
    const total = Object.keys(settings.onboarding).length;
    const completed = Object.values(settings.onboarding).filter(Boolean).length;
    return { total, completed, isComplete: completed === total };
  }, [settings.onboarding]);

  const closePage = async () => {
    try {
      const tab = await chrome.tabs.getCurrent();
      if (tab?.id) {
        await chrome.tabs.remove(tab.id);
        return;
      }
    } catch {
      // Ignore close failures and fall back to window.close.
    }
    window.close();
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8 pb-20 text-sm text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-brand-500 text-xs uppercase tracking-[0.2em]">
              Anicite
            </p>
            <h1 className="text-2xl font-semibold">Setup</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Local-only analytics with explicit consent.
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
              onboardingProgress.isComplete
                ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                : 'border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
            }`}
          >
            {onboardingProgress.completed}/{onboardingProgress.total} done
          </span>
        </header>

        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Onboarding checklist</h2>
          </div>
          <label className="flex items-center gap-3">
            <input
              checked={settings.onboarding.consentConfirmed}
              className="accent-brand-600 h-4 w-4"
              onChange={() => updateOnboarding('consentConfirmed')}
              type="checkbox"
            />
            <span>I have consent to track this device.</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              checked={settings.onboarding.privacyReviewed}
              className="accent-brand-600 h-4 w-4"
              onChange={() => updateOnboarding('privacyReviewed')}
              type="checkbox"
            />
            <span>I reviewed what data is stored locally.</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              checked={settings.onboarding.pinExtension}
              className="accent-brand-600 h-4 w-4"
              onChange={() => updateOnboarding('pinExtension')}
              type="checkbox"
            />
            <span>I know where to manage exclusions.</span>
          </label>
        </section>

        <section className="card space-y-3">
          <h2 className="text-base font-semibold">Data & privacy</h2>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Anicite records the host and path only. Query parameters and hash
            fragments are never stored.
          </p>
          <button
            className="button-ghost w-fit"
            onClick={clearData}
            type="button"
          >
            Clear local data
          </button>
        </section>

        <section className="card space-y-4">
          <h2 className="text-base font-semibold">Excluded sites</h2>
          <div className="flex flex-wrap gap-2">
            <input
              className="w-full flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              onChange={(event) => setNewHost(event.target.value)}
              placeholder="Add a domain (example.com)"
              value={newHost}
            />
            <button className="button-primary" onClick={addHost} type="button">
              Add
            </button>
          </div>
          {settings.excludeHosts.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No exclusions yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {settings.excludeHosts.map((host) => (
                <button
                  className="chip"
                  key={host}
                  onClick={() => removeHost(host)}
                  type="button"
                >
                  {host}
                  <span className="text-brand-500 dark:text-brand-300 text-[10px]">
                    Remove
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="h-1" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-zinc-200 bg-white/95 px-6 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-3xl items-center justify-end">
          <button className="button-primary" onClick={closePage} type="button">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
