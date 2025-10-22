// components/UserFileMsg.tsx
'use client';

import React from 'react';
import { useLivePlan } from '@/lib/useLivePlan';

export type Plan = 'free' | 'pro' | 'max';

export type Attachment = {
    id: string;
    name: string;
    mime: string;
    size: number;
    kind: 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'sheet' | 'text' | 'other';
    url?: string;
    remoteUrl?: string | null;
    status?: 'ready' | 'pending' | 'uploading' | 'error';
};

type Props = {
    attachments: Attachment[];
    disabledUntilReplyDone: boolean; // streaming || hasPendingUpload
    busyId?: string | null; // id currently being described

    /** Optional overrides/wiring */
    plan?: Plan; // if omitted, we read from useLivePlan()
    canDescribe?: boolean; // if omitted, derived from plan (free=>true, pro/max=>true)
    onUpgrade?: () => void; // called when user hits the gate

    onDescribe: (a: Attachment) => void; // SPEAK ONLY (fires your TTS flow)
};

/* ───────── icons ───────── */
function VolumeIcon() {
    return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M4 10v4h4l5 4V6l-5 4H4z" />
            <path d="M16 9a5 5 0 0 1 0 6" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M18 7a8 8 0 0 1 0 10" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
    );
}
function Spinner() {
    return (
        <svg viewBox="0 0 24 24" width="16" height="16" className="animate-spin">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" opacity=".25" />
            <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    );
}

export default function UserFileMsg({
    attachments,
    disabledUntilReplyDone,
    busyId,
    plan: planProp,
    canDescribe: canDescribeProp,
    onUpgrade,
    onDescribe,
}: Props) {
    // ---- PLAN SYNC (single source of truth) ----
    const { effPlan } = useLivePlan();
    const plan = (planProp ?? effPlan ?? 'free') as Plan;

    // If parent didn’t pass canDescribe, derive a sensible default from plan:
    // - free: allowed (server enforces 1/day); parent can flip to false after 429
    // - pro/max: always allowed
    const canDescribe =
        typeof canDescribeProp === 'boolean'
            ? canDescribeProp
            : plan === 'pro' || plan === 'max'
                ? true
                : true; // free default true; server will gate

    return (
        <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map(a => {
                const fileUrl = a.url || a.remoteUrl || '';
                const ready = !!fileUrl; // message attachments have URL only
                const isBusy = busyId === a.id;

                // Click handler respects plan gate
                const onClickDescribe = () => {
                    if (!ready || disabledUntilReplyDone || isBusy) return;
                    if (!canDescribe && onUpgrade) {
                        onUpgrade();
                        return;
                    }
                    onDescribe(a);
                };

                const title = !canDescribe
                    ? 'Upgrade to unlock unlimited listens'
                    : isBusy
                        ? 'Describing…'
                        : 'Listen (describe)';

                return (
                    <div
                        key={a.id}
                        className="relative overflow-hidden rounded-2xl border border-white/12 bg-white/5"
                        style={{ width: 220, maxWidth: '92vw' }}
                    >
                        {/* PREVIEW — no forced aspect ratio = no cutting */}
                        <div className="p-1 bg-black/15 rounded-2xl">
                            {/^image\//.test(a.mime) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={fileUrl}
                                    alt=""
                                    className="block w-full h-auto max-h-[72vh] object-contain rounded-xl"
                                    draggable={false}
                                />
                            ) : /^video\//.test(a.mime) ? (
                                <video
                                    src={fileUrl}
                                    className="block w-full h-auto max-h-[72vh] bg-black rounded-xl"
                                    muted
                                    controls
                                />
                            ) : (
                                <div className="h-[140px] grid place-items-center text-[12px] opacity-80">
                                    {a.kind.toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* SPEAKER — same black circular fill as ImageMsg; plan-gated */}
                        {ready && (
                            <button
                                type="button"
                                className={[
                                    'absolute right-2 top-2 h-7 w-7 grid place-items-center rounded-full',
                                    'bg-black text-white/95 shadow-sm hover:bg-black/85 active:scale-95',
                                    (disabledUntilReplyDone || isBusy) ? 'opacity-40 pointer-events-none' : '',
                                ].join(' ')}
                                title={title}
                                aria-label="Listen (describe)"
                                onClick={onClickDescribe}
                            >
                                {isBusy ? <Spinner /> : <VolumeIcon />}
                            </button>
                        )}

                        {/* Optional corner badge when gated (purely visual, doesn’t block clicks) */}
                        {!isBusy && ready && !canDescribe && (
                            <div className="absolute left-2 top-2 text-[10px] px-1.5 py-0.5 rounded bg-white/90 text-black/90">
                                Upgrade
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
