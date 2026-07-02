import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Sales() {
  const { companyId } = useAuth();

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [cart, setCart] = useState([]);
  const [history, setHistory] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  const [qty, setQty] = useState(1);
  const [payment, setPayment] = useState("Dinheiro");

  async function load() {
    if (!companyId) return;

    const { data: p } = await supabase
      .from("products")
      .select("*")
      .eq("company_id", companyId);

    const { data: s } = await supabase
      .from("sales")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    setProducts(p || []);
    setFiltered(p || []);
    setHistory(s || []);

    if (p?.length) setSelectedProduct(p[0].id);
  }

  useEffect(() => {
    load();
  }, [companyId]);

  // 🔎 SEARCH PRODUTOS
  useEffect(() => {
    if (!search) {
      setFiltered(products);
      return;
    }

    const result = products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );

    setFiltered(result);
  }, [search, products]);

  function addToCart() {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const exist = cart.find(i => i.id === product.id);

    if (exist) {
      setCart(
        cart.map(i =>
          i.id === product.id
            ? { ...i, qty: i.qty + Number(qty) }
            : i
        )
      );
    } else {
      setCart([...cart, { ...product, qty: Number(qty) }]);
    }
  }

  const total = cart.reduce(
    (s, i) => s + i.price * i.qty,
    0
  );

  async function finishSale() {
    if (!cart.length || !companyId) return;

    const { data } = await supabase
      .from("sales")
      .insert([
        {
          total,
          payment_method: payment,
          company_id: companyId,
        },
      ])
      .select()
      .single();

    for (const item of cart) {
      await supabase.from("sale_items").insert([
        {
          sale_id: data.id,
          product_id: item.id,
          quantity: item.qty,
          price: item.price,
        },
      ]);

      await supabase
        .from("products")
        .update({ stock: item.stock - item.qty })
        .eq("id", item.id);
    }

    setCart([]);
    load();
  }

  async function deleteSale(id) {
    if (!confirm("Excluir venda?")) return;

    await supabase.from("sale_items").delete().eq("sale_id", id);
    await supabase.from("sales").delete().eq("id", id);

    load();
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <Sidebar />

      <div className="flex-1 p-6 space-y-6">

        <h1 className="text-2xl font-bold">💰 Vendas</h1>

        {/* 🔎 SEARCH */}
        <input
          className="w-full p-2 bg-zinc-900 rounded"
          placeholder="Pesquisar produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* PRODUTOS FILTRADOS */}
        <div className="bg-zinc-900 p-4 rounded space-y-3">

          <select
            className="w-full p-2 bg-zinc-800 rounded"
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
          >
            {filtered.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (estoque: {p.stock})
              </option>
            ))}
          </select>

          <input
            type="number"
            className="w-full p-2 bg-zinc-800 rounded"
            value={qty}
            onChange={e => setQty(e.target.value)}
          />

          <button
            onClick={addToCart}
            className="w-full bg-indigo-600 p-2 rounded"
          >
            Adicionar
          </button>
        </div>

        {/* PAGAMENTO */}
        <div className="bg-zinc-900 p-4 rounded">
          <h2 className="font-bold mb-2">Pagamento</h2>

          <select
            className="w-full p-2 bg-zinc-800 rounded"
            value={payment}
            onChange={e => setPayment(e.target.value)}
          >
            <option>Dinheiro</option>
            <option>Pix</option>
            <option>Cartão Débito</option>
            <option>Cartão Crédito</option>
          </select>
        </div>

        {/* CARRINHO */}
        <div className="bg-zinc-900 p-4 rounded">
          <h2 className="font-bold mb-2">Carrinho</h2>

          {cart.map(i => (
            <div key={i.id} className="flex justify-between border-b py-1">
              <span>{i.name} x{i.qty}</span>
              <span>R$ {(i.price * i.qty).toFixed(2)}</span>
            </div>
          ))}

          <p className="mt-3 font-bold">
            Total: R$ {total.toFixed(2)}
          </p>

          <button
            onClick={finishSale}
            className="w-full mt-3 bg-green-600 p-2 rounded"
          >
            Finalizar Venda
          </button>
        </div>

        {/* HISTÓRICO */}
        <div className="bg-zinc-900 p-4 rounded">
          <h2 className="font-bold mb-2">Histórico</h2>

          {history.map(s => (
            <div key={s.id} className="flex justify-between border-b py-2">
              <div>
                <p>{new Date(s.created_at).toLocaleString()}</p>
                <p className="text-sm text-gray-400">
                  {s.payment_method} • R$ {s.total}
                </p>
              </div>

              <button
                onClick={() => deleteSale(s.id)}
                className="bg-red-600 px-3 py-1 rounded text-sm"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}