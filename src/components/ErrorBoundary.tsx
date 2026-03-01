import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RotateCcw, Download } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardContent className="pt-6 space-y-4 text-center">
              <div className="text-4xl">⚠️</div>
              <h2 className="text-lg font-bold">
                Se produjo un error inesperado
              </h2>
              <p className="text-sm text-muted-foreground">
                Se produjo un error al procesar la propuesta. Reintenta o
                descarga el PDF manualmente.
              </p>
              {this.state.error && (
                <details className="text-left text-xs bg-muted p-3 rounded-md">
                  <summary className="cursor-pointer font-medium">
                    Detalles técnicos
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap break-all">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <div className="flex gap-3 justify-center flex-wrap">
                <Button onClick={this.handleReload}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Recargar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
