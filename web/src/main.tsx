import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import './styles/system.css';
import { AppRouter } from './AppRouter';

// Gates the scroll-reveal hidden state so no-JS renders fully visible.
document.documentElement.classList.add('has-js');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
