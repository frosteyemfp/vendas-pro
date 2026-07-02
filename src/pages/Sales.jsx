import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Sales() {
  const { companyId } = useAuth();
  const [products, setProducts] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  async function loadData() {
    if (!companyId) return;
    const { data: pData } = await supabase.from("products").select("*").eq("company_id", companyId);
    if (pData) { setProducts(pData); if (pData.length > 0) setSelectedProductId(pData[0].id); }
    const { data: sData } = await supabase.from("sales").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
    if (sData) setSalesHistory(sData);
  }

  useEffect(() => { loadData(); }, [companyId]);

  function addToCart() {
    const product = products.find(p => p.id === selectedProductId);
    if (!product || product.stock < quantity) return alert("Estoque insuficiente!");
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      if (product.stock < existing.quantity + Number(quantity)) return alert("Estoque insuficiente!");
      setCart(cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + Number(quantity) } : i));
    } else { setCart([...cart, { ...product, quantity: Number(quantity) }]); }
  }

  const totalSale = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  async function handleCheckout() {
    if (cart.length === 0 || !companyId) return alert("Carrinho vazio!");
    const { data: saleData, error } = await supabase.from("sales").insert([{ total: totalSale, company_id: companyId }]).select().single();
    if (error) return alert(error.message);

    for (const item of cart) {
      await supabase.from("sale_items").insert([{ sale_id: saleData.id, product_id: item.id, quantity: item.quantity, price: item.price }]);
      await supabase.from("products").update({ stock: item.stock - item.quantity }).eq("id", item.id);
    }
    alert("Venda concluída!"); setCart([]); loadData();
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto pt-16 md:pt-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-6">💰 PDV & Histórico</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Novo Pedido</h2>
            <div className="flex gap-2">
              <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="flex-1 p-2 rounded bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white">
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock})</option>)}
              </select>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-16 p-2 rounded bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white" />
              <button onClick={addToCart} className="bg-indigo-600 text-white p-2 px-4 rounded">+</button>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Total: R$ {totalSale.toFixed(2)}</h3>
            <div className="divide-y">
              {cart.map(i => <div key={i.id} className="py-2 text-sm text-slate-700 dark:text-zinc-300">{i.name} x{i.quantity}</div>)}
            </div>
            <button onClick={handleCheckout} className="w-full bg-emerald-600 text-white font-bold p-2.5 rounded-lg">Fechar Venda</button>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Últimas Vendas</h2>
            <div className="divide-y max-h-[350px] overflow-y-auto">
              {salesHistory.map(s => (
                <div key={s.id} className="py-3 flex justify-between text-sm text-slate-700 dark:text-zinc-300">
                  <span>📅 {new Date(s.created_at).toLocaleDateString("pt-BR")}</span>
                  <strong className="text-emerald-600">R$ {Number(s.total).toFixed(2)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
