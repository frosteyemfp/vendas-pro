import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { companyId } = useAuth();

  const [kpis, setKpis] = useState({
    revenue: 0,
    profit: 0,
    margin: 0,
    sales: 0,
    pix: 0,
    cash: 0,
    card: 0,
  });

  const [topProducts, setTopProducts] = useState([]);

  async function load() {
    if (!companyId) return;

    const { data: sales } = await supabase
      .from("sales")
      .select("*")
      .eq("company_id", companyId);

    const { data: items } = await supabase
      .from("sale_items")
      .select("*, products(price,name,cost_price)")
      .eq("company_id", companyId);

    if (!sales || !items) return;

    // 💰 REVENUE
    const revenue = sales.reduce((a, s) => a + Number(s.total || 0), 0);

    // 💳 PAYMENT METHODS
    const pix = sales.filter(s => s.payment_method === "PIX").length;
    const cash = sales.filter(s => s.payment_method === "Dinheiro").length;
    const card = sales.filter(s => s.payment_method === "Cartão").length;

    // 📦 PROFIT
    let profit = 0;

    items.forEach(i => {
      const cost = Number(i.products?.cost_price || 0) * Number(i.quantity);
      const revenueItem = Number(i.price) * Number(i.quantity);
      profit += (revenueItem - cost);
    });

    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // 🏆 TOP PRODUCTS
    const map = {};

    items.forEach(i => {
      const name = i.products?.name;
      if (!name) return;

      if (!map[name]) map[name] = 0;
      map[name] += i.quantity;
    });

    const ranked = Object.entries(map)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    setTopProducts(ranked);

    setKpis({
      revenue,
      profit,
      margin,
      sales: sales.length,
      pix,
      cash,
      card,
    });
  }

  useEffect(() => {
    load();
  }, [companyId]);

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <Sidebar />

      <main className="flex-1 p-6 space-y-6">

        <h1 className="text-3xl font-bold">📊 Painel Inteligente</h1>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

          <Card title="Faturamento" value={`R$ ${kpis.revenue.toFixed(2)}`} />
          <Card title="Lucro" value={`R$ ${kpis.profit.toFixed(2)}`} />
          <Card title="Margem" value={`${kpis.margin.toFixed(2)}%`} />

          <Card title="Vendas" value={kpis.sales} />
          <Card title="PIX" value={kpis.pix} />
          <Card title="Dinheiro" value={kpis.cash} />
          <Card title="Cartão" value={kpis.card} />

        </div>

        {/* TOP PRODUCTS */}
        <div className="bg-zinc-900 p-4 rounded-xl">
          <h2 className="text-xl font-bold mb-3">🏆 Produtos mais vendidos</h2>

          {topProducts.map((p, i) => (
            <div key={i} className="flex justify-between border-b border-zinc-800 py-2">
              <span>{p.name}</span>
              <span>{p.qty} un</span>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-zinc-900 p-4 rounded-xl">
      <p className="text-sm text-zinc-400">{title}</p>
      <h2 className="text-xl font-bold">{value}</h2>
    </div>
  );
}