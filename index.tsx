// File: index.tsx (FINAL FIX + Global Modal Layer)
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

class AppErrorBoundary extends React.Component<
  any,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error!} />;
    }
    return this.props.children;
  }
}

// --- Render utama ---
const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        {/* 🌟 Global Style Fix agar modal selalu di atas footer/disclaimer */}
        <style>{`
          html, body, #root {
            position: relative;
            z-index: 0;
            overflow-x: hidden;
          }

          /* Modal Layer */
          .fixed[inset-0],
          [data-overlay="true"],
          .modal-overlay {
            z-index: 99999 !important;
            position: fixed !important;
          }

          .modal-content {
            z-index: 100000 !important;
            position: relative !important;
          }

          /* Footer atau disclaimer agar gak nembus modal */
          footer, .footer {
            z-index: 10 !important;
            position: relative !important;
          }
        `}</style>

        <App />
      </AuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
