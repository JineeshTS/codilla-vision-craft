import React from "react";

interface Props {
  children: React.ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.name || "Component"} crashed:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="glass-panel p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Something went wrong.</h2>
            <p className="text-muted-foreground text-sm">{this.props.name || "This section"} failed to load.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
