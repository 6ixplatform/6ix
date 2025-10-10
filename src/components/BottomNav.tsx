'use client';
import { usePathname, useRouter } from 'next/navigation';

type Item = { label: string; href: string };

const DEFAULT_ITEMS: Item[] = [
    { label: '6FEED', href: '/feed' },
    { label: '6IXAI', href: '/ai' },
    { label: '6GAME', href: '/game' },
];

export default function BottomNav({ items = DEFAULT_ITEMS }: { items?: Item[] }) {
    const router = useRouter();
    const pathname = usePathname() || '/';
    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(href + '/');

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                marginTop: 8,
                marginBottom: 4,
            }}
        >
            {items.map((it) => (
                <button
                    key={it.href}
                    onClick={() => router.push(it.href)}
                    className={`btn ${isActive(it.href) ? 'btn-water--active' : 'btn-water'}`}
                    style={{ whiteSpace: 'nowrap' }} // prevents label wrap; still shows as pills
                >
                    {it.label}
                </button>
            ))}
        </div>
    );
}
