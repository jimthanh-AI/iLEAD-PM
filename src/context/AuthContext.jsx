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
    setAppUser(data || null);
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

  /** Send magic link to email */
  const signIn = (email) =>
    supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

  /** Sign out and clear local state */
  const signOut = async () => {
    setAppUser(null);
    setSession(null);
    await supabase.auth.signOut();
  };

  /** Admin: add a new user to the whitelist and send them a magic link */
  const inviteUser = async (email, displayName, role) => {
    const { error } = await supabase
      .from('app_users')
      .insert({ email, display_name: displayName, role });
    if (error) return { error };
    // Send magic link (acts as invite email)
    return supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
  };

  /** Admin: remove a user from the whitelist */
  const removeUser = (email) =>
    supabase.from('app_users').delete().eq('email', email);

  const authLoading = session === undefined;

  return (
    <AuthContext.Provider value={{
      session,
      appUser,       // { email, display_name, role } | null
      authLoading,
      signIn,
      signOut,
      inviteUser,
      removeUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
