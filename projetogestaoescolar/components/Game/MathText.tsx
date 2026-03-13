import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
    text: string;
    className?: string;
    display?: boolean;
}

/**
 * Renderiza texto com suporte a LaTeX inline \( ... \) e display \[ ... \]
 * Texto sem LaTeX é renderizado como HTML normal.
 */
export const MathText: React.FC<MathTextProps> = ({ text, className, display }) => {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        try {
            // Se o texto é puro LaTeX de display (ex: \( ... \))
            const inlineMatch = text.match(/^\\\((.*)\\\)$/s);
            const displayMatch = text.match(/^\\\[(.*)\\\]$/s);

            if (inlineMatch || displayMatch || display) {
                const latex = inlineMatch?.[1] ?? displayMatch?.[1] ?? text;
                katex.render(latex.trim(), ref.current, {
                    displayMode: !!(displayMatch || display),
                    throwOnError: false,
                    output: 'html',
                });
                return;
            }

            // Texto misto: pode ter partes LaTeX e partes normais
            // Ex: "Calcule \( F = m \cdot a \) para m=2"
            const parts = text.split(/(\\\(.*?\\\)|\\\[.*?\\\])/gs);
            ref.current.innerHTML = '';

            for (const part of parts) {
                const inlineM = part.match(/^\\\((.*)\\\)$/s);
                const displayM = part.match(/^\\\[(.*)\\\]$/s);

                if (inlineM || displayM) {
                    const span = document.createElement('span');
                    katex.render((inlineM?.[1] ?? displayM?.[1] ?? '').trim(), span, {
                        displayMode: !!displayM,
                        throwOnError: false,
                        output: 'html',
                    });
                    ref.current.appendChild(span);
                } else {
                    ref.current.appendChild(document.createTextNode(part));
                }
            }
        } catch {
            if (ref.current) ref.current.textContent = text;
        }
    }, [text, display]);

    return <span ref={ref} className={className} />;
};
