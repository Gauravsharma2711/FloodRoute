"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("FloodRoute Error Boundary caught an error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-[#F9FAFB] p-4 text-[#111827]">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[26px]">warning</span>
            </div>
            <h2 className="text-lg font-bold text-[#111827] mb-1">
              Dispatch Interface Error
            </h2>
            <p className="text-xs text-[#6B7280] mb-4 leading-relaxed">
              An unexpected display issue occurred in the navigation console.
              Emergency route coordinates and cached data remain safe.
            </p>
            {this.state.error && (
              <div className="bg-[#F3F4F6] p-2.5 rounded-lg text-left text-[11px] font-mono text-[#374151] mb-5 overflow-x-auto max-h-32 border border-[#E5E7EB]">
                {this.state.error.message || "Unknown error"}
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl border border-[#D1D5DB] text-xs font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors"
              >
                Dismiss & Retry
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl bg-[#0B8A7E] hover:bg-[#097369] text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Reload Console</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
