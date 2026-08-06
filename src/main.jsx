import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './AuthContext.jsx';
import { DialogProvider } from './components/DialogProvider.jsx';
import './styles.css';

// Migration de confidentialité : supprimer les anciennes reprises de QCM publics persistantes.
try {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith('qcm_public_')) localStorage.removeItem(key);
  }
} catch {
  // Le navigateur peut interdire le stockage en mode privé.
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DialogProvider>
          <App />
        </DialogProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // L'application reste pleinement utilisable si l'installation PWA échoue.
    });
  });
}
