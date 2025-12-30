'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-[#0a0a0a] border border-red-500/30 rounded">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400 text-sm font-mono uppercase tracking-wider">
                            System Malfunction
                        </span>
                    </div>

                    <h3 className="text-white text-lg font-bold mb-2">
                        Transmission Error
                    </h3>

                    <p className="text-zinc-400 text-sm text-center mb-4 max-w-md">
                        A component encountered an unexpected error. This section has been
                        isolated to prevent cascade failure.
                    </p>

                    <code className="text-xs text-red-300 bg-red-950/30 px-3 py-2 rounded mb-4 max-w-full overflow-auto">
                        {this.state.error?.message || 'Unknown error'}
                    </code>

                    <button
                        onClick={this.handleRetry}
                        className="sx-button-outline text-xs"
                        aria-label="Retry loading this component"
                    >
                        Attempt Recovery
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Simple error fallback for less critical components
 */
export function ErrorFallback({
    message = 'Component unavailable',
    compact = false,
}: {
    message?: string;
    compact?: boolean;
}) {
    return (
        <div
            className={`flex items-center justify-center ${compact ? 'p-2' : 'p-6'
                } bg-[#0a0a0a] border border-zinc-800 rounded`}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-zinc-500 text-xs font-mono uppercase">
                    {message}
                </span>
            </div>
        </div>
    );
}

/**
 * Async error fallback with loading state
 */
export function AsyncErrorFallback({
    isLoading = false,
    error,
    onRetry,
}: {
    isLoading?: boolean;
    error?: Error | null;
    onRetry?: () => void;
}) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-zinc-500 text-xs font-mono uppercase tracking-wider">
                        Establishing connection...
                    </span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-6 gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-red-400 text-xs font-mono uppercase">
                        Connection Failed
                    </span>
                </div>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="text-xs text-zinc-400 hover:text-white underline"
                    >
                        Retry
                    </button>
                )}
            </div>
        );
    }

    return null;
}
