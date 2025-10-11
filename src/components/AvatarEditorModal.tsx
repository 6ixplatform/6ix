// ./src/components/AvatarEditorModal.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
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
    onSubmit: (file: File | null) => Promise<void> | void; // pass null to remove
};

export default function AvatarEditorModal({ profile, onClose, onSubmit }: Props) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const [preview, setPreview] = React.useState<string | null>(profile.avatarUrl ?? null);
    const objectUrlRef = React.useRef<string | null>(null);
    const [busy, setBusy] = React.useState(false);

    // Avoid SSR/portal issues
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    // Revoke previous blob URL on unmount/change
    React.useEffect(() => {
        return () => {
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        };
    }, []);

    const pickFile = React.useCallback(() => {
        inputRef.current?.click();
    }, []);

    // ⬅️ renamed so linter doesn't think it's a hook
    const applyFile = React.useCallback((f: File) => {
        if (!f.type.startsWith('image/')) return;
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        const url = URL.createObjectURL(f);
        objectUrlRef.current = url;
        setPreview(url);
        setFile(f);
    }, []);

    const onInputChange = React.useCallback<React.ChangeEventHandler<HTMLInputElement>>((e) => {
        const f = e.currentTarget.files?.[0] ?? null;
        if (f) applyFile(f);
        // reset so same file can be re-picked
        e.currentTarget.value = '';
    }, [applyFile]);

    const onDrop = React.useCallback<React.DragEventHandler<HTMLDivElement>>((e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0] ?? null;
        if (f) applyFile(f);
    }, [applyFile]);

    const onDragOver = React.useCallback<React.DragEventHandler<HTMLDivElement>>((e) => {
        e.preventDefault();
    }, []);

    const removePhoto = React.useCallback(() => {
        setFile(null);
        setPreview(null);
    }, []);

    const doSave = React.useCallback(async () => {
        setBusy(true);
        try {
            await onSubmit(file); // parent uploads/removes based on null
            onClose();
        } finally {
            setBusy(false);
        }
    }, [file, onClose, onSubmit]);

    const onBackdropKeyDown = React.useCallback<React.KeyboardEventHandler<HTMLDivElement>>((e) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter') void doSave();
    }, [doSave, onClose]);

    if (!mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[1000] grid place-items-center bg-black/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Edit avatar"
            onKeyDown={onBackdropKeyDown}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="relative w-[min(560px,94vw)] rounded-2xl border border-white/12 bg-black/30 backdrop-blur-xl p-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md hover:bg-white/10"
                    onClick={onClose}
                    aria-label="Close"
                    type="button"
                >
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 pb-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white/10 shrink-0">
                        {preview ? (
                            <Image src={preview} alt="" fill sizes="48px" className="object-cover" unoptimized />
                        ) : (
                            <div className="grid h-full w-full place-items-center text-xs opacity-70">No photo</div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-[15px] font-medium">
                            {profile.displayName || 'Your profile'}
                        </div>
                    </div>
                </div>

                {/* Drop zone */}
                <div
                    className="mt-2 rounded-xl border border-white/15 bg-white/5 p-4 transition hover:bg-white/7"
                    role="group"
                    aria-label="Upload avatar"
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                >
                    <div className="flex items-center gap-4">
                        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-white/10 shrink-0">
                            {preview ? (
                                <Image
                                    src={preview}
                                    alt="Avatar preview"
                                    fill
                                    sizes="176px"
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="grid h-full w-full place-items-center text-xs opacity-70">Preview</div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="text-sm opacity-90">Drag &amp; drop an image here, or</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="h-8 rounded-lg bg-white px-3 text-sm text-black active:scale-[.98]"
                                    onClick={pickFile}
                                >
                                    Choose file
                                </button>
                                <button
                                    type="button"
                                    className="h-8 rounded-lg bg-white/15 px-3 text-sm active:scale-[.98]"
                                    onClick={removePhoto}
                                >
                                    Remove
                                </button>
                            </div>
                            <div className="mt-2 text-[12px] opacity-60">PNG, JPG or GIF • square works best</div>
                        </div>
                    </div>

                    <input ref={inputRef} type="file" accept="image/*" hidden onChange={onInputChange} />
                </div>

                {/* Footer */}
                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        className="h-9 rounded-lg bg-white/12 px-3 text-sm active:scale-[.98]"
                        onClick={onClose}
                        disabled={busy}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="h-9 rounded-lg bg-white px-3 text-sm text-black active:scale-[.98]"
                        onClick={doSave}
                        disabled={busy}
                    >
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
