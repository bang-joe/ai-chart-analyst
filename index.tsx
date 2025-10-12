import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // ❗ cukup './App' tanpa .tsx
import { AuthProvider } from './context/AuthContext'; // ❗ tanpa .tsx

// --- Google Analytics ---
const GA_MEASUREMENT_ID = 'G-XS2DX5XNM6';

// ✅ Load dinamis agar tidak error Rollup
if (GA_MEASUREMENT_ID && import.meta.env.MODE === 'production') {
  import('react-ga4').then((ReactGA) => {
    ReactGA.default.initialize(GA_MEASUREMENT_ID);
    ReactGA.default.send({
      hitType: 'pageview',
      page: window.location.pathname,
      title: document.title,
    });
    console.log('📊 Google Analytics aktif:', GA_MEASUREMENT_ID);
  });
}

// --- Render utama ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
