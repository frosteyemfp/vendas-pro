import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  function toggleTheme() {
    setDarkMode(!darkMode);
  }

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  async function getUserProfile(sessionUser) {
    if (!sessionUser) {
      setCompanyId(null);
      setLoading(false);
      return;
    }
    try {
      // Busca simples na tabela profiles filtrando pelo ID do usuário logado
      const { data, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", sessionUser.id);

      if (data && data.length > 0) {
        // Captura o id puro da empresa vinculado ao perfil
        const idQuery = data[0].company_id;
        setCompanyId(idQuery);
      } else {
        setCompanyId(null);
      }
    } catch (err) {
      console.error(err);
      setCompanyId(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user || null;
      setUser(sessionUser);
      getUserProfile(sessionUser);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);
      getUserProfile(sessionUser);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, companyId, loading, darkMode, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
