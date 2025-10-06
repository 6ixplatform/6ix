'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type ProfileMini = {
    displayName?: string | null;
    username?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    plan?: string | null;
    premium?: boolean;
    verified?: boolean;

};

type Props = {
    profile: ProfileMini;
    onClose: () => void;
    onSubmit: (file: File | null) => Promise<void> | void; // returns File (or null to remove)
};

export default function AvatarEditorModal({ profile, onClose, onSubmit }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(profile.avatarUrl || null);
    const objectUrlRef = useRef<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        return () => {
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        };
    }, []);

    function pickFile() { fileRef.current?.click(); }

    function useFile(f: File) {
        if (!f.type.startsWith('image/')) return;
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        const url = URL.createObjectURL(f);
        objectUrlRef.current = url;
        setPreview(url);
        setFile(f);
    }

    function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (f) useFile(f);
        e.currentTarget.value = '';
    }

    function onDrop(e: React.DragEvent) {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) useFile(f);
    }

    function removePhoto() {
        setFile(null);
        setPreview(null);
    }

    async function doSave() {
        setBusy(true);
        try {
            await onSubmit(file); // parent uploads & persists
            onClose();
        } finally { setBusy(false); }
    }

    function onKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter') void doSave();
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm grid place-items-center"
            onClick={onClose}
            onKeyDown={onKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label="Edit avatar"
        >
            <div
                className="relative w-[min(560px,94vw)] rounded-2xl border border-white/12 bg-black/30 backdrop-blur-xl p-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-md hover:bg-white/10"
                    onClick={onClose}
                    aria-label="Close"
                    type="button"
                >
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 pb-3">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-white/10 shrink-0">
                        {preview ? <img src={preview} className="h-full w-full object-cover" alt="" /> : <div className="w-full h-full grid place-items-center text-xs opacity-70">No photo</div>}
                    </div>
                    <div className="min-w-0">
                        <div className="text-[15px] font-medium truncate">{profile.displayName || 'Your profile'}</div>
                    </div>
                </div>

                {/* Drop zone */}
                <div
                    className="mt-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/7 transition p-4"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                    role="group"
                    aria-label="Upload avatar"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-24 w-24 rounded-full overflow-hidden bg-white/10 shrink-0">
                            {preview ? <img src={preview} className="h-full w-full object-cover" alt="Avatar preview" /> : <div className="w-full h-full grid place-items-center text-xs opacity-70">Preview</div>}
                        </div>
                        <div className="flex-1">
                            <div className="text-sm opacity-90">Drag & drop an image here, or</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <button type="button" className="px-3 h-8 rounded-lg bg-white text-black text-sm active:scale-[.98]" onClick={pickFile}>Choose file</button>
                                <button type="button" className="px-3 h-8 rounded-lg bg-white/15 text-sm active:scale-[.98]" onClick={removePhoto}>Remove</button>
                            </div>
                            <div className="mt-2 text-[12px] opacity-60">PNG, JPG or GIF • square works best</div>
                        </div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={onInputChange} />
                </div>

                {/* Footer */}
                <div className="mt-4 flex justify-end gap-2">
                    <button type="button" className="px-3 h-9 rounded-lg bg-white/12 text-sm active:scale-[.98]" onClick={onClose}>Cancel</button>
                    <button type="button" className="px-3 h-9 rounded-lg bg-white text-black text-sm active:scale-[.98]" onClick={doSave} disabled={busy}>
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
