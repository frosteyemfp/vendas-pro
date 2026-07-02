import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { companyId } = useAuth();
  const [companyName, setCompanyName] = useState("");

  async function loadCompany() {
    if (!companyId) return;
    const { data } = await supabase.from("companies").select("name").eq("id", companyId);
    if (data && data.length > 0) {
      setCompanyName(data[0].name || "");
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!companyName || !companyId) return;
    const { error } = await supabase.from("companies").update({ name: companyName }).eq("id", companyId);
    if (!error) alert("Configurações salvas!");
  }

  useEffect(() => { loadCompany(); }, [companyId]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto pt-16 md:pt-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-6">⚙️ Configurações da Empresa</h1>
        <form onSubmit={handleUpdate} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm max-w-md space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">Nome da Empresa (SaaS):</label>
            {/* O || "" garante que o input nunca fique sem controle */}
            <input value={companyName || ""} onChange={e => setCompanyName(e.target.value)} className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold p-2.5 rounded-lg text-sm transition-colors">Atualizar Dados</button>
        </form>
      </main>
    </div>
  );
}
