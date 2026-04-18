import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);  // checking stored token on boot

  // On mount — restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem("ibm_token");
    if (!token) { setLoading(false); return; }
    api.auth.me()
      .then(u  => setUser(u))
      .catch(() => localStorage.removeItem("ibm_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { token, user } = await api.auth.login(email, password);
    localStorage.setItem("ibm_token", token);
    setUser(user);
  }

  function logout() {
    localStorage.removeItem("ibm_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
