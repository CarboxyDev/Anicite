import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  outDirTemplate: '{{browser}}-mv{{manifestVersion}}{{modeSuffix}}',
  manifest: {
    name: 'Anicite',
    description:
      'Local-only analytics of your browsing activity. Understand your habits without compromising your privacy.',
    manifest_version: 3,
    incognito: 'not_allowed',
    permissions: ['storage', 'unlimitedStorage'],
    host_permissions: ['http://*/*', 'https://*/*'],
    action: {
      default_title: 'Anicite',
      default_popup: 'popup/index.html',
      default_icon: {
        16: 'icons/icon-16.png',
        32: 'icons/icon-32.png',
        48: 'icons/icon-48.png',
        128: 'icons/icon-128.png',
      },
    },
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
  },
});
