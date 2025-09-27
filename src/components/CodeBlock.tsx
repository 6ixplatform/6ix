// components/CodeBlock.tsx
import React from 'react';

export default function CodeBlock({ children, className }: { children: any; className?: string }) {
    const text = String(children).replace(/\n$/, '');
    return (
        <div className="relative group">
            <button
                onClick={() => navigator.clipboard.writeText(text)}
                className="absolute right-2 top-2 text-xs px-2 py-1 rounded bg-white/10 border border-white/20"
                aria-label="Copy code"
            >
                Copy
            </button>
            <pre className="overflow-auto rounded-lg"><code className={className}>{text}</code></pre>
        </div>
    );
}
