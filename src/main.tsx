import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById("root")!);

// Error boundary wrapper to catch and display runtime errors
try {
  const { default: App } = await import('./App.tsx');
  root.render(<App />);
} catch (error: any) {
  console.error('❌ FLL App failed to load:', error);
  root.render(
    <div dir="rtl" style={{
      fontFamily: 'Tajawal, sans-serif',
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      background: '#0f2744',
      color: '#fff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#f59e0b', fontSize: '24px', marginBottom: '16px' }}>
        ⚠️ خطأ في تحميل التطبيق
      </h1>
      <p style={{ color: '#94a3b8', marginBottom: '12px' }}>
        حدث خطأ أثناء تحميل التطبيق. التفاصيل:
      </p>
      <pre style={{
        background: '#1e3a5f',
        padding: '16px',
        borderRadius: '8px',
        textAlign: 'left',
        direction: 'ltr',
        fontSize: '13px',
        maxWidth: '100%',
        overflow: 'auto',
        color: '#fca5a5',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all'
      }}>
        {error?.message || String(error)}
        {error?.stack && '\n\n' + error.stack}
      </pre>
      <p style={{ color: '#64748b', marginTop: '16px', fontSize: '13px' }}>
        First Line Logistics — fll.sa
      </p>
    </div>
  );
}
