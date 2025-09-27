// lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Uses auth-helpers; honors the HttpOnly cookies set by /api/auth/verify-otp
export const sb = () => createBrowserClient(url, key);
