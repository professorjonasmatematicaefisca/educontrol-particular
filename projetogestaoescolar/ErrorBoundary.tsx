import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // In production, you would send this to an error tracking service
        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-[#1a2332] rounded-2xl border border-red-500/30 p-8 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="text-red-500" size={32} />
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">
                            Algo deu errado
                        </h1>

                        <p className="text-gray-400 mb-6">
                            Ocorreu um erro inesperado. Por favor, tente recarregar a página ou entre em contato com o suporte se o problema persistir.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 mb-2">
                                    Detalhes técnicos (apenas em desenvolvimento)
                                </summary>
                                <div className="bg-[#0f172a] rounded-lg p-3 text-xs text-red-400 font-mono overflow-auto max-h-40">
                                    <p className="font-bold mb-2">{this.state.error.toString()}</p>
                                    <pre className="text-gray-500 whitespace-pre-wrap">
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </div>
                            </details>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={18} />
                                Tentar Novamente
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                            >
                                Voltar ao Início
                            </button>
                        </div>

                        <p className="text-xs text-gray-600 mt-6">
                            Se precisar de ajuda, entre em contato com o suporte técnico
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
