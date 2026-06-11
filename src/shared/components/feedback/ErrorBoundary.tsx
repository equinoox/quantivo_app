import { Component, ErrorInfo, PropsWithChildren, ReactNode } from "react";
import { Text, View } from "react-native";

type ErrorBoundaryState = { hasError: boolean };

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(): ErrorBoundaryState { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo): void { console.error("Unhandled UI error", error, info.componentStack); }
  render(): ReactNode {
    if (this.state.hasError) {
      return <View className="flex-1 items-center justify-center bg-background p-6"><Text className="text-xl font-semibold text-ink">Quantivo needs a refresh</Text><Text className="mt-2 text-center text-muted">An unexpected screen error occurred.</Text></View>;
    }
    return this.props.children;
  }
}
