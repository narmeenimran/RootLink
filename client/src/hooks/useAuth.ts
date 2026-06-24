import { useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getSupabaseConfigError } from '@/lib/config';

function friendlyAuthError(error: AuthError | Error): string {
  const msg = error.message.toLowerCase();
  if (msg.includes('invalid login credentials')) {
    return 'Wrong email or password. Double-check and try again.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please verify your email first — check your inbox for the confirmation link from Supabase.';
  }
  if (msg.includes('user already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (msg.includes('fetch') || msg.includes('network')) {
    return 'Cannot reach Supabase. Check your internet and that VITE_SUPABASE_URL in client/.env is correct.';
  }
  if (msg.includes('invalid api key')) {
    return 'Invalid Supabase anon key. Copy the anon/public key from Supabase → Settings → API into client/.env.';
  }
  return error.message;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureConfigured = () => {
    const configError = getSupabaseConfigError();
    if (configError) throw new Error(configError);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    ensureConfigured();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw new Error(friendlyAuthError(error));
    return data;
  };

  const signIn = async (email: string, password: string) => {
    ensureConfigured();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(friendlyAuthError(error));
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(friendlyAuthError(error));
  };

  const resetPassword = async (email: string) => {
    ensureConfigured();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw new Error(friendlyAuthError(error));
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(friendlyAuthError(error));
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    isAuthenticated: !!session,
  };
}
