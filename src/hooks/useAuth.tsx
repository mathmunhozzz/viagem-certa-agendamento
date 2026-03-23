import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isValidating = useRef(false);

  useEffect(() => {
    let isActive = true;

    // 1. Listen to auth state changes - use session data directly, NO async Supabase calls here
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!isActive) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    // 2. Get initial session (fast, from local storage)
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isActive) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);

      // 3. Background server-side validation (non-blocking)
      if (initialSession) {
        validateServerSide();
      }
    });

    // 4. Safety timeout - never stay loading forever
    const timeout = setTimeout(() => {
      if (isActive) setLoading(false);
    }, 10000);

    // 5. Periodic re-validation every 5 minutes
    const interval = setInterval(() => {
      validateServerSide();
    }, 5 * 60 * 1000);

    return () => {
      isActive = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Server-side validation - runs outside of onAuthStateChange to avoid deadlocks
  const validateServerSide = async () => {
    if (isValidating.current) return;
    isValidating.current = true;
    try {
      const { error } = await supabase.auth.getUser();
      if (error) {
        console.warn('Sessão inválida detectada, forçando logout');
        await supabase.auth.signOut();
      }
    } catch (e) {
      // Network error - don't logout, just skip
    } finally {
      isValidating.current = false;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut({ scope: 'global' });
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
