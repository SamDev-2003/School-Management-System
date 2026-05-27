import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
const Ctx = createContext(null);
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } });
  const [profile, setProfile] = useState(() => { try { return JSON.parse(localStorage.getItem("profile")); } catch { return null; } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.get("/auth/me").then(r => {
        setUser(r.data.user); setProfile(r.data.profile);
        localStorage.setItem("user", JSON.stringify(r.data.user));
        localStorage.setItem("profile", JSON.stringify(r.data.profile));
      }).catch(() => localStorage.clear()).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("profile", JSON.stringify(data.profile));
    setUser(data.user); setProfile(data.profile);
    return data.user;
  };
  const logout = () => { localStorage.clear(); setUser(null); setProfile(null); };
  const refreshProfile = async () => {
    const { data } = await api.get("/auth/me");
    setUser(data.user); setProfile(data.profile);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("profile", JSON.stringify(data.profile));
  };
  return <Ctx.Provider value={{ user, profile, loading, login, logout, refreshProfile }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
