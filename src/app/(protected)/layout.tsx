// app/(protected)/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // preserve where the user meant to go; change '/ai' if you reuse for other routes
        redirect('/auth/signin?next=/ai');
    }

    // Optional: keep users who haven't finished onboarding out of the app
    const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .maybeSingle();

    if (!profile?.onboarding_completed) {
        redirect('/profile');
    }

    return <>{children}</>;
}
