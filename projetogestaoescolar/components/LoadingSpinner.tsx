import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    text?: string;
    fullScreen?: boolean;
}

const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    text,
    fullScreen = false
}) => {
    const spinnerSize = sizeMap[size];

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-[#0a0f1e]/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#1a2332] rounded-2xl border border-emerald-500/30 p-8 flex flex-col items-center gap-4">
                    <Loader2 className="text-emerald-500 animate-spin" size={spinnerSize} />
                    {text && <p className="text-gray-300 text-sm font-medium">{text}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-3">
            <Loader2 className="text-emerald-500 animate-spin" size={spinnerSize} />
            {text && <span className="text-gray-300 text-sm">{text}</span>}
        </div>
    );
};
