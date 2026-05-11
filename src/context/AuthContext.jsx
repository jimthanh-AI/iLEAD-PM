import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // undefined = still loading, null = no session
  const [session, setSession]   = useState(undefined);
  const [appUser, setAppUser]   = useState(null);

  const fetchAppUser = async (email) => {
    const { data } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .single();
    if (data) {
      setAppUser(data);
      return data;
    }
    // First login: auto-create as viewer
    const newUser = { email, display_name: email.split('@')[0], role: 'viewer' };
    const { data: created } = await supabase
      .from('app_users').insert(newUser).select().single();
    const resolved = created || newUser;
    setAppUser(resolved);
    return resolved;
  };

  useEffect(() => {
    // 1. Get existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
      if (session?.user?.email) fetchAppUser(session.user.email);
      else setSession(null);
    });

    // 2. Listen for sign-in / sign-out / token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      if (session?.user?.email) fetchAppUser(session.user.email);
      else setAppUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /** Send OTP code (6 digits) to any email — auto-create viewer on first login */
  const signIn = (email) =>
    supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

  /** Verify the 6-digit OTP code entered by user */
  const verifyOtp = (email, token) =>
    supabase.auth.verifyOtp({ email, token, type: 'email' });

  /** Sign out and clear local state */
  const signOut = async () => {
    setAppUser(null);
    setSession(null);
    await supabase.auth.signOut();
  };

  /** Admin: load all users */
  const fetchAllUsers = async () => {
    const { data } = await supabase.from('app_users').select('*').order('created_at');
    return data || [];
  };

  /** Admin: update a user's role */
  const updateUserRole = async (email, role) => {
    const { error } = await supabase.from('app_users').update({ role }).eq('email', email);
    // Refresh own appUser if editing self
    if (!error && appUser?.email === email) setAppUser(u => ({ ...u, role }));
    return { error };
  };

  /** Admin: remove a user */
  const removeUser = (email) =>
    supabase.from('app_users').delete().eq('email', email);

  const authLoading = session === undefined;

  return (
    <AuthContext.Provider value={{
      session,
      appUser,       // { email, display_name, role } | null
      authLoading,
      signIn,
      verifyOtp,
      signOut,
      fetchAllUsers,
      updateUserRole,
      removeUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
