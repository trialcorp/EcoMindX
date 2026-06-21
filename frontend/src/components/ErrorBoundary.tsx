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
        <div className="error-boundary-wrapper" role="alert">
          <svg
            aria-hidden="true"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="error-boundary-icon"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 className="error-boundary-title">Something went wrong</h2>
          <p className="error-boundary-text">
            An unexpected error occurred. Please try reloading the page.
          </p>
          {this.state.error && (
            <pre className="error-boundary-details">{this.state.error.message}</pre>
          )}
          <button onClick={this.handleReload} className="btn" type="button">
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
