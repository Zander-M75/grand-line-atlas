import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/im-fell-english/400.css';
import '@fontsource/im-fell-english/400-italic.css';
import '@fontsource-variable/atkinson-hyperlegible-next';
import './styles/tokens.css';
import './styles/global.css';
import { restoreFromUrl } from './hooks/useUrlSync';
import { App } from './App';

// Open the arc a shared link points to before anything renders.
restoreFromUrl();

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element in index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
