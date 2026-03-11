/**
 * Shared stub page component — used as placeholder for pages
 * that are routed in App.tsx but not yet implemented in the React SPA.
 * The actual public pages are served by the static index.html (Skywork bundle).
 */
export default function StubPage({ title }: { title: string }) {
  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.75rem",
      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
      color: "#94a3b8",
    }}>
      <div style={{
        width: "48px", height: "48px", borderRadius: "12px",
        background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "20px",
      }}>
        🚧
      </div>
      <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e2e8f0" }}>{title}</h2>
      <p style={{ fontSize: "13px", color: "#64748b" }}>هذه الصفحة قيد التطوير</p>
    </div>
  );
}
