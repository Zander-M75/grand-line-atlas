import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/im-fell-english/400.css';
import '@fontsource/im-fell-english/400-italic.css';
import '@fontsource-variable/atkinson-hyperlegible-next';
import './styles/tokens.css';
import './styles/global.css';
import { applyCssTimings } from './animation/cssTimings';
import { restoreFromUrl } from './hooks/useUrlSync';
import { restoreSaved } from './store';
import { App } from './App';

// Before anything renders: the viewer's saved spoiler limit and settings, then the arc a
// shared link points to (which may be past that limit).
restoreSaved();
restoreFromUrl();
applyCssTimings();

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element in index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
