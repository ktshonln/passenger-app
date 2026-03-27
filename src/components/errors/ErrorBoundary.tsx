import React, { Component, ReactNode } from "react";
import ServerErrorScreen from "../../screens/errors/ServerErrorScreen";

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render-time errors and shows the 500 screen.
 * Wrap around any screen or subtree that may throw.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) console.error("[ErrorBoundary]", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return <ServerErrorScreen onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
