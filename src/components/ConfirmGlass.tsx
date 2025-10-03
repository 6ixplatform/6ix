'use client';
import { createPortal } from 'react-dom';

export default function ConfirmGlass({
    open, title = 'Are you sure?', message,
    confirmLabel = 'Confirm', cancelLabel = 'Cancel',
    onConfirm, onClose,
}: {
    open: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onClose: () => void;
}) {
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[2000]"> {/* was z-[100] */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
z-[2001] w-[92%] max-w-sm rounded-2xl border border-white/15
bg-white/60 text-white shadow-2xl pointer-events-auto"
            >
                <div className="p-4">
                    <div className="text-[15px] font-semibold mb-1">{title}</div>
                    {message && <div className="text-[13px] opacity-80">{message}</div>}
                    <div className="mt-4 flex justify-end gap-2">
                        <button className="btn btn-water" onClick={onClose}>{cancelLabel}</button>
                        <button
                            className="btn btn-water font-semibold border-red-300/40 text-red-100 hover:bg-red-500/20"
                            onClick={() => { onConfirm(); onClose(); }}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
