/**
 * Error Boundary — catches render errors in admin panel pages
 * Shows a friendly Arabic error message with retry option
 */
import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          dir="rtl"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            gap: "16px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "rgba(239,68,68,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={32} style={{ color: "#ef4444" }} />
          </div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--con-text-primary, #111)",
              margin: 0,
            }}
          >
            حدث خطأ غير متوقع
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "var(--con-text-muted, #888)",
              maxWidth: "400px",
              lineHeight: 1.6,
            }}
          >
            نعتذر عن هذا الخطأ. يمكنك المحاولة مرة أخرى أو العودة للوحة التحكم.
          </p>
          {this.state.error && (
            <pre
              style={{
                fontSize: "11px",
                color: "var(--con-text-muted, #888)",
                background: "var(--con-bg-surface-2, #f3f4f6)",
                padding: "8px 16px",
                borderRadius: "8px",
                maxWidth: "500px",
                overflow: "auto",
                direction: "ltr",
                textAlign: "left",
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={this.handleRetry}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 20px",
                borderRadius: "8px",
                background: "var(--con-brand, #3b82f6)",
                color: "#fff",
                border: "none",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={16} />
              حاول مرة أخرى
            </button>
            <button
              onClick={() => (window.location.href = "/admin-panel/dashboard")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                background: "var(--con-bg-surface-2, #f3f4f6)",
                color: "var(--con-text-secondary, #555)",
                border: "1px solid var(--con-border-default, #e5e7eb)",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              العودة للوحة التحكم
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
