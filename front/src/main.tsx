import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppShell } from '@app/AppShell';
import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
);
