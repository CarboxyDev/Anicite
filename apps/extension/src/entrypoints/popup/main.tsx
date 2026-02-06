import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '../../styles/tailwind.css';

import React from 'react';
import { createRoot } from 'react-dom/client';

import { ErrorBoundary } from '../../lib/ErrorBoundary';
import { App } from './App';

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (prefersDark) {
  document.documentElement.classList.add('dark');
}

window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', (e) => {
    if (e.matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary variant="popup">
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
