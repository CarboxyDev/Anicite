import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  variant?: 'popup' | 'page';
}

export function ErrorFallback({
  error,
  resetError,
  variant = 'page',
}: ErrorFallbackProps) {
  const isPopup = variant === 'popup';

  const handleRefresh = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('insights.html') });
  };

  return (
    <div
      className={`bg-background text-foreground flex min-h-screen flex-col items-center justify-center ${
        isPopup ? 'w-[320px] p-5' : 'p-8'
      }`}
    >
      <div
        className={`flex flex-col items-center text-center ${
          isPopup ? 'max-w-[280px]' : 'max-w-md'
        }`}
      >
        {/* Animated error icon */}
        <div className="relative mb-6">
          <div className="bg-destructive/20 absolute inset-0 animate-ping rounded-full" />
          <div className="from-destructive/10 to-destructive/5 ring-destructive/20 relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ring-1">
            <AlertTriangle className="text-destructive h-8 w-8" />
          </div>
        </div>

        {/* Title */}
        <h1 className={`font-semibold ${isPopup ? 'text-lg' : 'text-xl'} mb-2`}>
          Something went wrong
        </h1>

        {/* Description */}
        <p
          className={`text-muted-foreground mb-6 leading-relaxed ${
            isPopup ? 'text-xs' : 'text-sm'
          }`}
        >
          {isPopup
            ? 'The extension encountered an unexpected error. Try refreshing or open the insights page.'
            : 'An unexpected error occurred while loading this page. This is likely a temporary issue that can be resolved by refreshing.'}
        </p>

        {/* Error details (collapsible in page mode) */}
        {error && !isPopup && (
          <details className="mb-6 w-full">
            <summary className="text-muted-foreground hover:text-foreground mb-2 cursor-pointer text-xs transition-colors">
              View error details
            </summary>
            <div className="bg-muted/50 rounded-lg border p-3 text-left">
              <code className="text-muted-foreground block break-all text-[11px] leading-relaxed">
                {error.message || 'Unknown error'}
              </code>
            </div>
          </details>
        )}

        {/* Action buttons */}
        <div className={`flex gap-2 ${isPopup ? 'w-full flex-col' : ''}`}>
          <button
            onClick={handleRefresh}
            className={`btn btn-primary ${isPopup ? 'w-full' : ''}`}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            {isPopup ? 'Refresh' : 'Refresh page'}
          </button>

          {isPopup && (
            <button
              onClick={handleGoHome}
              className="btn btn-secondary w-full"
              type="button"
            >
              <Home className="h-4 w-4" />
              Open Insights
            </button>
          )}
        </div>

        {/* Support hint */}
        <p
          className={`text-muted-foreground mt-6 ${
            isPopup ? 'text-[10px]' : 'text-xs'
          }`}
        >
          If this issue persists,{' '}
          <span className="text-foreground/70">
            try reloading the extension
          </span>{' '}
          from chrome://extensions
        </p>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  variant?: 'popup' | 'page';
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging purposes
    console.error('[Anicite] Error caught by boundary:', error);
    console.error('[Anicite] Component stack:', errorInfo.componentStack);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error ?? undefined}
          resetError={this.resetError}
          variant={this.props.variant}
        />
      );
    }

    return this.props.children;
  }
}
