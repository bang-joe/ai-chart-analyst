// File: index.tsx (FINAL FIX – No Blank Screen & Cache Refresh)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// ✅ Bersihkan service worker lama (biar login screen gak stuck cache)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  });
}

// ✅ Error Boundary supaya gak crash blank
const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="min-h-screen bg-red-900 text-white flex flex-col items-center justify-center p-8">
    <h1 className="text-3xl font-bold mb-4">❌ Render Error</h1>
    <p className="text-lg mb-2">Aplikasi gagal dimuat. Mungkin ada masalah koneksi atau cache.</p>
    <pre className="mt-4 p-4 bg-red-800 text-sm rounded-lg overflow-x-auto max-w-full">
      {error.message || 'Error tidak diketahui.'}
    </pre>
    <p className="mt-4 text-sm">Coba Hard Refresh (Ctrl + Shift + R).</p>
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
    console.error('Uncaught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) return <ErrorFallback error={this.state.error!} />;
    return this.props.children;
  }
}

// ✅ Render utama aman
const rootEl = document.getElementById('root');
if (!rootEl) throw new Error("❌ Elemen root tidak ditemukan di index.html");

const root = ReactDOM.createRoot(rootEl);
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
