// File: index.tsx (FINAL FIX: Modal Layer & Global Sync)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// --- Error Boundary Sederhana ---
const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="min-h-screen bg-red-900 text-white flex flex-col items-center justify-center p-8">
    <h1 className="text-3xl font-bold mb-4">❌ Render Error</h1>
    <p className="text-lg mb-2">
      Aplikasi gagal dimuat. Ini sering disebabkan oleh masalah konfigurasi.
    </p>
    <pre className="mt-4 p-4 bg-red-800 text-sm rounded-lg overflow-x-auto max-w-full">
      {error.message || 'Error tidak diketahui.'}
    </pre>
    <p className="mt-4 text-sm">
      Coba Hard Refresh (Ctrl+Shift+R). Jika error berlanjut, hubungi admin.
    </p>
  </div>
);

class AppErrorBoundary extends React.Component<any, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error!} />;
    }
    return this.props.children;
  }
}

/// --- Fix Global: Matikan interaksi & visibilitas elemen di luar modal ---
const modalFix = () => {
  const style = document.createElement("style");
  style.innerHTML = `
    /* Saat modal aktif, sembunyikan semua elemen fixed di luar modal */
    body.modal-open footer,
    body.modal-open [class*="disclaimer"],
    body.modal-open [class*="footer"],
    body.modal-open [class*="fixed"]:not(.modal-overlay):not(.modal-container) {
      visibility: hidden !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);
};
modalFix();


// --- Render utama ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
