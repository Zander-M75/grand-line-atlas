import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/im-fell-english/400.css';
import '@fontsource/im-fell-english/400-italic.css';
import '@fontsource-variable/atkinson-hyperlegible-next';
import './styles/tokens.css';
import './styles/global.css';
import { restoreFromUrl } from './hooks/useUrlSync';
import { systemPrefersReducedMotion } from './hooks/useReducedMotion';
import { restoreSaved, startIntro } from './store';
import { App } from './App';

// Before anything renders: the viewer's saved spoiler limit and settings, the arc a shared
// link points to (which may be past that limit), and on a first visit, the intro.
restoreSaved();
restoreFromUrl();
startIntro(systemPrefersReducedMotion());

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element in index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
