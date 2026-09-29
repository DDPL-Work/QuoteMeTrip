// Authentication context object + hook (Phase 3).
//
// Kept in a component-free module so the provider file satisfies
// react-refresh colocation (components only).

import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth() must be used inside an AuthProvider.');
  }
  return context;
}
