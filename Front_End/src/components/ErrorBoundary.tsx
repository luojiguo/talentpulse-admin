import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  resetKey: number;
}

/**
 * React 错误边界（兼容 React 18）
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // 显式声明，避免类型服务误报 props/setState
  declare props: Readonly<ErrorBoundaryProps> & Readonly<{ children?: ReactNode }>;
  declare setState: React.Component<ErrorBoundaryProps, ErrorBoundaryState>['setState'];

  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    resetKey: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary捕获到错误:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      errorInfo: null,
      resetKey: prev.resetKey + 1,
    }));
  };

  render() {
    const { children, fallback } = this.props;
    const { hasError, error, errorInfo, resetKey } = this.state;

    if (hasError) {
      if (fallback) return fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
              出错了
            </h2>
            
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              应用程序遇到了意外错误。请刷新页面重试。
            </p>

            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm font-mono text-red-800 dark:text-red-300 mb-2">
                  {error.toString()}
                </p>
                {errorInfo && (
                  <details className="text-xs text-red-700 dark:text-red-400">
                    <summary className="cursor-pointer mb-2">错误堆栈</summary>
                    <pre className="overflow-auto max-h-40 whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                重试
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 用 key 触发子树重建，实现“重试”效果
    return <React.Fragment key={resetKey}>{children}</React.Fragment>;
  }
}

export default ErrorBoundary;