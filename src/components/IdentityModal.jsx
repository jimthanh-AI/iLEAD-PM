// IdentityModal disabled — replaced by Supabase Magic Link auth (AuthContext)
import React from 'react';
// eslint-disable-next-line no-unused-vars
import './IdentityModal.css';

// Kept for import compatibility; real auth is now handled by AuthContext + LoginPage
export const ROLES = {
  admin : { label: 'Admin',  desc: '' },
  editor: { label: 'Editor', desc: '' },
  viewer: { label: 'Viewer', desc: '' },
};

export const IdentityModal = () => null;
