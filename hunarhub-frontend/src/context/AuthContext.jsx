import { createContext, useContext, useState } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Reads the saved user once on page load so a refresh keeps you logged in.
function loadUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const saveSession = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  // POST /api/auth/login  → { token, user }
  const login = async (contact, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { contact, password } });
    saveSession(data);
    return data.user;
  };

  // POST /api/auth/register  → { token, user }   (Customer accounts only)
  const register = async (form) => {
    const data = await api('/auth/register', { method: 'POST', body: form });
    saveSession(data);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
