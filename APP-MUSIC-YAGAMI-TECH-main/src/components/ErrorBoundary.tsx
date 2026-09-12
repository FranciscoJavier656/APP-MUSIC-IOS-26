import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg?: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: undefined
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true, errorMsg: _?.message || String(_) };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center">
          <div className="bg-red-500/10 p-4 rounded-full mb-4">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <h2 className="text-lg font-semibold mb-2">Algo salió mal</h2>
          <p className="text-xs text-red-400 mb-2 font-mono">{this.state.errorMsg}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-xs">
            Hubo un error al cargar esta sección. Por favor, intenta de nuevo.
          </p>
          <button
            className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold text-sm"
            onClick={() => this.setState({ hasError: false })}
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
