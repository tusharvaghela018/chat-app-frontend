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
                <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
                    <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
                        <h1 className="mb-3 text-2xl font-bold text-gray-800">
                            Something went wrong
                        </h1>

                        <p className="mb-6 text-gray-500">
                            An unexpected error occurred. Please reload the page.
                        </p>

                        <button
                            onClick={this.handleReload}
                            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;