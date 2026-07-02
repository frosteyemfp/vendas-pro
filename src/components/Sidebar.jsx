import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useAuth();
  const [open, setOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 left-4 z-50 bg-indigo-600 text-white p-2 rounded"
      >
        ☰
      </button>

      <aside className={`fixed md:static w-64 h-screen bg-zinc-900 text-white p-5 transition-transform z-40 ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>

        <h1 className="text-xl font-bold mb-6 text-indigo-400">
          SaaS Vendas
        </h1>

        <nav className="flex flex-col gap-2 text-sm">

          <Link to="/" className="p-2 rounded hover:bg-zinc-800">
            📊 Dashboard
          </Link>

          <Link to="/sales" className="p-2 rounded hover:bg-zinc-800">
            💰 Vendas (PDV)
          </Link>

          <Link to="/products" className="p-2 rounded hover:bg-zinc-800">
            📦 Produtos
          </Link>

          <Link to="/categories" className="p-2 rounded hover:bg-zinc-800">
            🏷️ Categorias
          </Link>

          <Link to="/employees" className="p-2 rounded hover:bg-zinc-800">
            👥 Funcionários
          </Link>

          <Link to="/reports" className="p-2 rounded hover:bg-zinc-800">
            📈 Relatórios
          </Link>

        </nav>

        <div className="mt-6 flex flex-col gap-2">

          <button
            onClick={toggleTheme}
            className="bg-zinc-800 p-2 rounded"
          >
            🌙 Tema
          </button>

          <button
            onClick={logout}
            className="bg-red-600 p-2 rounded"
          >
            Sair
          </button>

        </div>
      </aside>
    </>
  );
}