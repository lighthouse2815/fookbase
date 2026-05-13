import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

const DEFAULT_MESSAGE = 'Trang gặp lỗi runtime. Vui lòng tải lại trang.';

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: DEFAULT_MESSAGE,
  };

  public static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message?.trim() || DEFAULT_MESSAGE,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Keep details in console for production debugging without crashing the whole app.
    console.error('[AppErrorBoundary] Unhandled UI error', error, errorInfo);
  }

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="w-full max-w-xl rounded-2xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-400/30 dark:bg-slate-900">
          <h1 className="text-lg font-semibold text-rose-600 dark:text-rose-300">Frontend đã gặp lỗi</h1>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{this.state.errorMessage}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
}
