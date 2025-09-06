
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReportCrash = () => {
    const { error, errorInfo } = this.state;
    const subject = "Phunt App Crash Report";
    const body = `
        A crash occurred. Please see the details below:\n
        -------------------------------------------\n
        Error: ${error?.toString()}\n
        Stack: ${error?.stack}\n
        Component Stack: ${errorInfo?.componentStack}\n
        -------------------------------------------\n
        Steps to reproduce (if known):\n
        [Please add any details here]\n
    `;

    window.location.href = `mailto:your-email@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  
  private handleRestart = () => {
    window.location.replace('/');
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-4">
          <Bot className="size-20 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Oops, phunt has crashed.</h1>
          <p className="text-muted-foreground mt-2">
            Restarting the app usually fixes the issue.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <Button onClick={this.handleRestart}>
              Restart App
            </Button>
            <Button variant="secondary" onClick={this.handleReportCrash}>
              Report Crash
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

    