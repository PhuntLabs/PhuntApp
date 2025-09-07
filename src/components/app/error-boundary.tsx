
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
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In a real app, you'd send this to a reporting service like Sentry, LogRocket, etc.
    console.error("Uncaught error:", error, errorInfo);
  }
  
  private handleReload = () => {
    window.location.reload();
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-4">
          <Bot className="size-20 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Oops! Phunt has crashed.</h1>
           {this.state.error && (
            <p className="text-muted-foreground mt-2 max-w-md">
              The error was: "{this.state.error.toString()}"
            </p>
          )}
          <p className="text-muted-foreground mt-2">
            This error has been automatically reported. Please reload the app to continue.
          </p>
          <div className="mt-6">
            <Button onClick={this.handleReload}>
              Reload App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
