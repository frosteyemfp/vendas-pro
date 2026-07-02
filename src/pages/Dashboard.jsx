import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { companyId } = useAuth();
  const [faturamento, setFaturamento] = useState(0);
  const [totalVendas, setTotalVendas] = useState(0);
  const [totalEstoque, setTotalEstoque] = useState(0);
  const [filtroDias, setFiltroDias] = useState("all");

  async function loadDashboardData() {
    if (!companyId) return;
    let query = supabase.from("sales").select("total").eq("company_id", companyId);

    if (filtroDias === "today") {
      const hoje = new Date(); hoje.setHours(0,0,0,0);
      query = query.gte("created_at", hoje.toISOString());
    } else if (filtroDias === "7") {
      const seteDiasAtras = new Date(); seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      query = query.gte("created_at", seteDiasAtras.toISOString());
    }

    const { data: salesData } = await query;
    if (salesData) {
      setFaturamento(salesData.reduce((sum, sale) => sum + Number(sale.total || 0), 0));
      setTotalVendas(salesData.length);
    }
    const { data: productsData } = await supabase.from("products").select("stock").eq("company_id", companyId);
    if (productsData) {
      setTotalEstoque(productsData.reduce((sum, prod) => sum + Number(prod.stock || 0), 0));
    }
  }

  useEffect(() => { loadDashboardData(); }, [companyId, filtroDias]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto pt-16 md:pt-10">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Dashboard Geral</h1>
          </div>
          <select value={filtroDias} onChange={e => setFiltroDias(e.target.value)} className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white shadow-sm text-sm">
            <option value="all">Todo o período</option>
            <option value="today">Hoje</option>
            <option value="7">Últimos 7 dias</option>
          </select>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Faturamento</h3>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">R$ {faturamento.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Vendas</h3>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{totalVendas} pedido(s)</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Estoque Total</h3>
            <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{totalEstoque} un.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
