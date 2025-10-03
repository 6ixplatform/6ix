// app/(protected)/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) redirect('/auth/signin'); // ← blocks all guests
    return <>{children}</>;
}