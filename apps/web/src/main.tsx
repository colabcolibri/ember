import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App.js';
import { Toaster } from './components/ui/sonner.js';
import { routerBasename } from './lib/mock-mode.js';
import './i18n/index.js';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename()}>
      <App />
      <Toaster />
    </BrowserRouter>
  </StrictMode>,
);
