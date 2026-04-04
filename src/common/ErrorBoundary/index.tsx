import Button from "@/common/Button";
import React, { Component, type ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Error caught:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-background px-4">
                    <div className="max-w-md rounded-2xl bg-card p-8 text-center shadow-lg border border-border">
                        <h1 className="mb-3 text-2xl font-bold text-foreground">
                            Something went wrong
                        </h1>

                        <p className="mb-6 text-muted-foreground">
                            An unexpected error occurred. Please reload the page.
                        </p>

                        <Button
                            onClick={this.handleReload}
                            fullWidth
                        >
                            Reload Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;