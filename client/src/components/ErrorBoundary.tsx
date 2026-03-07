import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';
import { RefreshCwIcon, AlertTriangleIcon } from 'lucide-react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        // Here you would integrate Sentry: Sentry.captureException(error);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                    <div className="mb-6 rounded-full bg-red-100 p-4 dark:bg-red-900/20">
                        <AlertTriangleIcon className="h-12 w-12 text-red-600" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold tracking-tight">Something went wrong</h2>
                    <p className="mb-8 max-w-md text-muted-foreground">
                        We've encountered an unexpected error. Don't worry, our automated systems have been notified.
                    </p>
                    <div className="flex gap-4">
                        <Button
                            variant="primary"
                            className="gap-2"
                            onClick={() => window.location.reload()}
                        >
                            <RefreshCwIcon className="h-4 w-4" />
                            Reload Application
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                this.setState({ hasError: false });
                                window.location.href = '/';
                            }}
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-8 overflow-auto rounded-lg bg-muted p-4 text-left text-xs font-mono max-w-2xl">
                            <p className="font-bold text-red-600 mb-2">{this.state.error?.name}: {this.state.error?.message}</p>
                            {this.state.error?.stack}
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
