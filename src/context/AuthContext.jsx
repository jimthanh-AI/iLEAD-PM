import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = 'ilead_user';

export const AuthProvider = ({ children }) => {
  // undefined = still loading from localStorage, null = not logged in
  const [appUser, setAppUser] = useState(undefined);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setAppUser(saved ? JSON.parse(saved) : null);
  }, []);

  /** Login by email only — no OTP, no magic link */
  const signIn = async (email) => {
    const trimmed = email.trim().toLowerCase();

    // Look up in app_users table
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', trimmed)
      .single();

    // PGRST116 = no rows found (not a real error)
    if (error && error.code !== 'PGRST116') {
      return { error };
    }

    let user = data;

    if (!user) {
      // Auto-create as viewer
      const displayName = trimmed.split('@')[0];
      const { data: newUser, error: insertError } = await supabase
        .from('app_users')
        .insert({ email: trimmed, display_name: displayName, role: 'viewer' })
        .select()
        .single();
      if (insertError) return { error: insertError };
      user = newUser;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setAppUser(user);
    return { data: user };
  };

  /** Sign out and clear local state */
  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAppUser(null);
  };

  /** Admin: add a new user with a specific role */
  const inviteUser = async (email, displayName, role) => {
    const { error } = await supabase
      .from('app_users')
      .insert({ email, display_name: displayName, role });
    return { error };
  };

  /** Admin: load all users */
  const fetchAllUsers = async () => {
    const { data } = await supabase.from('app_users').select('*').order('created_at');
    return data || [];
  };

  /** Admin: update a user's role */
  const updateUserRole = async (email, role) => {
    const { error } = await supabase.from('app_users').update({ role }).eq('email', email);
    if (!error && appUser?.email === email) setAppUser(u => ({ ...u, role }));
    return { error };
  };

  /** Admin: remove a user */
  const removeUser = (email) =>
    supabase.from('app_users').delete().eq('email', email);

  const authLoading = appUser === undefined;

  // Keep `session` shape for backward compat with any code that reads session.user.email
  const session = appUser ? { user: { email: appUser.email } } : null;

  return (
    <AuthContext.Provider value={{
      session,
      appUser,       // { email, display_name, role } | null
      authLoading,
      signIn,
      signOut,
      inviteUser,
      fetchAllUsers,
      updateUserRole,
      removeUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
