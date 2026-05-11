import { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../lib/api";
import { saveToken, saveUser, getToken, getUser, clearAll } from "../lib/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const token = await getToken();
      const storedUser = await getUser();
      if (token && storedUser) {
        setUser(storedUser);
        // Verify token is still valid
        try {
          const res = await authAPI.me();
          setUser(res.data.user);
          await saveUser(res.data.user);
        } catch {
          await clearAll();
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Auth load error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function register(name, email, password, role = "user") {
    const res = await authAPI.register({ name, email, password, role });
    const { token, user } = res.data;
    await saveToken(token);
    await saveUser(user);
    setUser(user);
    return res.data;
  }

  async function login(email, password) {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    await saveToken(token);
    await saveUser(user);
    setUser(user);
    return res.data;
  }

  async function logout() {
    try {
      await authAPI.logout();
    } catch { }
    await clearAll();
    setUser(null);
  }

  async function refreshUser() {
    try {
      const res = await authAPI.me();
      setUser(res.data.user);
      await saveUser(res.data.user);
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  }

  const isAuthenticated = !!user;
  const isOrganizer = user?.role === "organizer";
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isOrganizer,
        isAdmin,
        register,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}