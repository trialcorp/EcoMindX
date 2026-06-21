import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary that catches React render-time crashes and
 * displays a friendly fallback instead of a blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary] Uncaught render error:", error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            textAlign: "center",
            fontFamily:
              '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
            color: "#f3f4f6",
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginBottom: "1.5rem" }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>
            Something went wrong
          </h2>
          <p style={{ color: "#9ca3af", maxWidth: "400px", margin: "0 0 1.5rem" }}>
            An unexpected error occurred. Please try reloading the page.
          </p>
          {this.state.error && (
            <pre
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: "8px",
                padding: "1rem",
                fontSize: "0.8rem",
                color: "#f87171",
                maxWidth: "500px",
                overflow: "auto",
                marginBottom: "1.5rem",
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            style={{
              fontFamily: "inherit",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              border: "none",
              borderRadius: "10px",
              padding: "0.8rem 1.5rem",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(16, 185, 129, 0.2)",
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
