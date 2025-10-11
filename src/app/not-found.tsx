// app/not-found.tsx

export default function NotFound() {
    return (
        <main className="min-h-dvh bg-black text-zinc-100 grid place-items-center p-6 text-center">
            <div>
                <div className="text-5xl mb-3">🤷‍♂️</div>
                <h1 className="text-2xl font-semibold">Page not found</h1>
                <p className="text-white/70 mt-1">
                    The page you’re looking for doesn’t exist yet or was moved.
                </p>
            </div>
        </main>
    );
}
