// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
    return (
        <main className="min-h-dvh bg-black text-zinc-100 grid place-items-center p-6 text-center">
            <div>
                <div className="text-5xl mb-3">🤷‍♂️</div>
                <h1 className="text-2xl font-semibold">Page not found</h1>
                <p className="text-white/70 mt-1">
                    The page you’re looking for doesn’t exist or was moved.
                </p>
                <Link
                    href="/ai"
                    className="inline-block mt-4 rounded-full bg-white text-black px-4 py-2 text-sm font-semibold"
                >
                    Go Home
                </Link>
            </div>
        </main>
    );
}
