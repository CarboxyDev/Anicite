import { defineBackground } from 'wxt/sandbox';

import { SETTINGS_KEY } from '../lib/constants';
import { DEFAULT_SETTINGS } from '../lib/settings';
import { setSettings } from '../lib/storage';

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason !== 'install') {
      return;
    }

    const existing = await chrome.storage.local.get(SETTINGS_KEY);
    if (!existing[SETTINGS_KEY]) {
      await setSettings(DEFAULT_SETTINGS);
    }

    chrome.runtime.openOptionsPage();
  });
});
