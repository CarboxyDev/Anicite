import { useEffect, useState } from 'react';

import {
  DEFAULT_SETTINGS,
  normalizeHost,
  type Settings,
} from '../../lib/settings';
import { clearStore, getSettings, updateSettings } from '../../lib/storage';

export function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [newHost, setNewHost] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      const storedSettings = await getSettings();
      setSettings(storedSettings);
    };
    void init();
  }, []);

  const handleToggleTracking = async () => {
    const next = await updateSettings({ enabled: !settings.enabled });
    setSettings(next);
  };

  const handleAddExclusion = async () => {
    const host = normalizeHost(newHost);
    if (!host || settings.excludeHosts.includes(host)) {
      setNewHost('');
      return;
    }

    const next = await updateSettings({
      excludeHosts: [...settings.excludeHosts, host],
    });
    setSettings(next);
    setNewHost('');
  };

  const handleRemoveExclusion = async (host: string) => {
    const next = await updateSettings({
      excludeHosts: settings.excludeHosts.filter((h) => h !== host),
    });
    setSettings(next);
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      await clearStore();
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 3000);
    } finally {
      setIsClearing(false);
      setShowClearConfirm(false);
    }
  };

  const openOnboarding = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
  };

  const closePage = async () => {
    try {
      const tab = await chrome.tabs.getCurrent();
      if (tab?.id) {
        await chrome.tabs.remove(tab.id);
        return;
      }
    } catch {
      // Ignore
    }
    window.close();
  };

  return (
    <div className="bg-background text-foreground min-h-screen px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10">
          <p className="text-primary text-xs font-semibold uppercase tracking-widest">
            Anicite
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your tracking preferences and data.
          </p>
        </header>

        <div className="space-y-8">
          <section className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">Tracking</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Control whether Anicite collects browsing data.
                </p>
              </div>
              <button
                className="switch"
                data-state={settings.enabled ? 'checked' : 'unchecked'}
                onClick={handleToggleTracking}
                type="button"
                aria-label="Toggle tracking"
              >
                <span className="switch-thumb" />
              </button>
            </div>
            {!settings.enabled && (
              <p className="text-muted-foreground mt-3 text-xs">
                Tracking is paused. No browsing data is being collected.
              </p>
            )}
          </section>

          <section className="card">
            <div>
              <h2 className="font-semibold">Excluded Sites</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Sites in this list will not be tracked. Subdomains are included.
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                className="input flex-1"
                placeholder="example.com"
                value={newHost}
                onChange={(e) => setNewHost(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void handleAddExclusion();
                  }
                }}
              />
              <button
                className="btn btn-secondary"
                onClick={() => void handleAddExclusion()}
                type="button"
              >
                Add
              </button>
            </div>

            {settings.excludeHosts.length > 0 ? (
              <div className="mt-4 space-y-2">
                {settings.excludeHosts.map((host) => (
                  <div
                    key={host}
                    className="border-border bg-muted/30 flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span className="text-sm">{host}</span>
                    <button
                      className="text-destructive text-xs hover:underline"
                      onClick={() => void handleRemoveExclusion(host)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground mt-4 text-xs">
                No excluded sites. All sites are being tracked.
              </p>
            )}
          </section>

          <section className="card">
            <div>
              <h2 className="font-semibold">Data</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Manage your locally stored browsing data.
              </p>
            </div>

            <div className="mt-4">
              {showClearConfirm ? (
                <div className="space-y-3">
                  <p className="text-destructive text-sm">
                    Are you sure? This will permanently delete all stored
                    browsing data.
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-destructive"
                      onClick={() => void handleClearData()}
                      disabled={isClearing}
                      type="button"
                    >
                      {isClearing ? 'Clearing...' : 'Yes, clear all data'}
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setShowClearConfirm(false)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn btn-outline"
                  onClick={() => setShowClearConfirm(true)}
                  type="button"
                >
                  Clear all data
                </button>
              )}

              {clearSuccess && (
                <p className="text-success mt-3 text-xs">
                  All browsing data has been cleared.
                </p>
              )}
            </div>
          </section>

          <section className="card">
            <div>
              <h2 className="font-semibold">Privacy</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                What Anicite collects and stores.
              </p>
            </div>

            <div className="text-muted-foreground mt-4 space-y-3 text-xs">
              <div className="flex items-start gap-2">
                <span className="bg-primary mt-1 h-2 w-2 shrink-0 rounded-full" />
                <p>
                  <strong className="text-foreground">URL data:</strong> Host
                  and path only. Query strings and hashes are never saved.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-primary mt-1 h-2 w-2 shrink-0 rounded-full" />
                <p>
                  <strong className="text-foreground">Activity metrics:</strong>{' '}
                  Page visits, active time, clicks, and scroll depth.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-primary mt-1 h-2 w-2 shrink-0 rounded-full" />
                <p>
                  <strong className="text-foreground">Storage:</strong> All data
                  is stored locally in your browser. Nothing is sent to any
                  server.
                </p>
              </div>
            </div>
          </section>

          <div className="border-border border-t pt-6">
            <button
              className="text-primary text-sm hover:underline"
              onClick={openOnboarding}
              type="button"
            >
              Re-run onboarding wizard
            </button>
          </div>
        </div>

        <div className="mt-10 flex justify-end">
          <button className="btn btn-primary" onClick={closePage} type="button">
            Close settings
          </button>
        </div>
      </div>
    </div>
  );
}
