import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createClient, type Session, type User } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key) : null;

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  configured: boolean;
  loading: boolean;
  signUp: (username: string, email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);
  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null, session, configured: Boolean(supabase), loading,
    async signUp(username, email, password) {
      if (!supabase) return { error: 'Chưa cấu hình Supabase trên website.', needsConfirmation: false };
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username: username.trim() } } });
      return { error: error?.message ?? null, needsConfirmation: Boolean(data.user && !data.session) };
    },
    async signIn(email, password) {
      if (!supabase) return { error: 'Chưa cấu hình Supabase trên website.' };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    async signOut() { if (supabase) await supabase.auth.signOut(); }
  }), [session, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider required');
  return value;
}
