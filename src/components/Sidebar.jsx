import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-indigo-600 text-white shadow-md">
        {isOpen ? "✕" : "☰"}
      </button>

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 dark:bg-zinc-900 text-white p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div>
          <h2 className="text-xl font-bold text-indigo-400 mb-8">Vendas Pro 🚀</h2>
          <nav className="flex flex-col gap-2">
            <Link to="/" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 dark:hover:bg-zinc-800 transition-colors">📊 Dashboard</Link>
            <Link to="/products" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 dark:hover:bg-zinc-800 transition-colors">📦 Produtos</Link>
            <Link to="/categories" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 dark:hover:bg-zinc-800 transition-colors">🏷️ Categorias</Link>
            <Link to="/sales" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 dark:hover:bg-zinc-800 transition-colors">💰 Vendas</Link>
            <Link to="/settings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 dark:hover:bg-zinc-800 transition-colors">⚙️ Configurações</Link>
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <button onClick={toggleTheme} className="w-full text-center p-2 rounded-lg bg-slate-800 dark:bg-zinc-800 text-sm font-medium hover:bg-slate-700 dark:hover:bg-zinc-700 border border-slate-700 dark:border-zinc-700 text-white">
            {darkMode ? "☀️ Modo Claro" : "🌙 Modo Escuro"}
          </button>
          <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white font-medium p-2 rounded-lg transition-colors">
            Sair
          </button>
        </div>
      </aside>

      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 z-30 bg-black opacity-50 md:hidden"></div>}
    </>
  );
}
