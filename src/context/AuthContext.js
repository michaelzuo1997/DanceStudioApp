import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchUserInfo(s.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchUserInfo(s.user.id);
      else setUserInfo(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserInfo = useCallback(async (userId) => {
    const { data } = await supabase
      .from('Users Info')
      .select()
      .eq('user_id', userId)
      .limit(1);
    setUserInfo(data?.[0] ?? null);
  }, []);

  const refreshUserInfo = useCallback(async () => {
    if (user?.id) await fetchUserInfo(user.id);
  }, [user, fetchUserInfo]);

  const signInWithEmail = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUpWithEmail = useCallback(async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { data, error };
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    userInfo,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
    refreshUserInfo,
  }), [user, session, loading, userInfo, signInWithEmail, signUpWithEmail, resetPassword, signOut, refreshUserInfo]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
