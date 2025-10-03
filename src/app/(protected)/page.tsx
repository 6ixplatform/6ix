// app/(protected)/page.tsx
import Link from 'next/link';

export default function ProtectedHome() {
    return (
        <main className="mx-auto max-w-md p-6 space-y-3">
            <h1 className="text-xl font-semibold">6IX</h1>
            <nav className="grid gap-2">
                <Link className="btn btn-water" href="/ai">Open AI</Link>
                <Link className="btn btn-water" href="/music">Music</Link>
                <Link className="btn btn-water" href="/game">Game</Link>
                <Link className="btn btn-water" href="/wallet">Wallet</Link>
                <Link className="btn btn-water" href="/settings">Settings</Link>
                <Link className="btn btn-water" href="/ai?overlay=history">History</Link>
                <Link className="btn btn-water" href="/premium">Go Premium</Link>
            </nav>
        </main>
    );
}
