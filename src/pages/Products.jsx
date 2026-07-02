import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Products() {
  const { companyId } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function loadData() {
    if (!companyId) return;
    const { data: catData } = await supabase.from("categories").select("*").eq("company_id", companyId);
    if (catData) {
      setCategories(catData);
      if (catData.length > 0 && !categoryId) setCategoryId(catData[0].id);
    }
    const { data: prodData } = await supabase.from("products").select("*").eq("company_id", companyId);
    if (prodData) setProducts(prodData);
  }

  async function uploadImage(file) {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from("products").upload(fileName, file);
      if (error) throw error;
      return supabase.storage.from("products").getPublicUrl(fileName).data.publicUrl;
    } catch (err) { alert(err.message); return null; } finally { setUploading(false); }
  }

  async function handleSaveProduct(e) {
    e.preventDefault();
    const currentCategory = categoryId || (categories.length > 0 ? categories[0].id : "");
    if (!name || !price || !stock || !currentCategory || !companyId) return alert("Preencha todos os campos e certifique-se de ter uma categoria cadastrada!");

    let imageUrl = products.find(p => p.id === editingId)?.image_url || null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) return;
    }

    const payload = { name, price: Number(price), stock: Number(stock), category_id: currentCategory, company_id: companyId, image_url: imageUrl };
    const { error } = editingId 
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert([payload]);

    if (!error) {
      setName(""); setPrice(""); setStock(""); setEditingId(null); setImageFile(null);
      if(document.getElementById("product-image")) document.getElementById("product-image").value = "";
      loadData();
    } else { alert(error.message); }
  }

  function startEdit(product) {
    setEditingId(product.id); setName(product.name); setPrice(product.price); setStock(product.stock); setCategoryId(product.category_id);
  }

  async function handleDelete(id, imageUrl) {
    if (!confirm("Tem certeza que deseja apagar este produto do catálogo?")) return;
    try {
      await supabase.from("sale_items").delete().eq("product_id", id);
      if (imageUrl) {
        const fileName = imageUrl.split("/").pop();
        await supabase.storage.from("products").remove([fileName]);
      }
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (!error) loadData();
    } catch (err) { alert(err.message); }
  }

  useEffect(() => { loadData(); }, [companyId]);

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto pt-16 md:pt-10">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-6">📦 Catálogo de Produtos</h1>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <form onSubmit={handleSaveProduct} className="bg-slate-50 dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm h-fit space-y-4">
            <h2 className="text-lg font-bold">{editingId ? "Editar Item" : "Novo Item"}</h2>
            <input placeholder="Nome" value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Preço" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
              <input placeholder="Estoque" type="number" value={stock} onChange={e => setStock(e.target.value)} className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" required>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input id="product-image" type="file" accept="image/*" onChange={e => setImageFile(e.target.files)[0]} className="w-full text-xs text-slate-500 dark:text-zinc-400" />
            
            <button type="submit" disabled={uploading} className={`w-full text-white font-semibold p-2.5 rounded-lg text-sm transition-colors ${editingId ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
              {uploading ? "Enviando..." : editingId ? "Atualizar Produto" : "Criar Produto"}
            </button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setName(""); setPrice(""); setStock(""); }} className="w-full bg-slate-500 text-white p-2 text-sm rounded-lg">Cancelar</button>}
          </form>

          <div className="xl:col-span-2 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-white dark:bg-zinc-800 text-slate-400 uppercase tracking-wider text-xs border-b border-slate-200 dark:border-zinc-700">
                    <th className="p-4">Foto</th>
                    <th className="p-4">Nome</th>
                    <th className="p-4">Preço</th>
                    <th className="p-4">Estoque</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 text-sm text-slate-700 dark:text-zinc-300">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-white/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4">{p.image_url ? <img src={p.image_url} className="w-10 h-10 object-cover rounded-lg" /> : <div className="w-10 h-10 bg-slate-200 dark:bg-zinc-700 rounded-lg" />}</td>
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">{p.name}</td>
                      <td className="p-4">R$ {Number(p.price).toFixed(2)}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded-md text-xs font-bold ${p.stock < 5 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-white text-slate-700 dark:bg-zinc-800 dark:text-zinc-400"}`}>{p.stock} un</span></td>
                      <td className="p-4 flex gap-2 justify-center">
                        <button onClick={() => startEdit(p)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 p-2 rounded-lg transition-colors text-xs font-semibold">Editar</button>
                        <button onClick={() => handleDelete(p.id, p.image_url)} className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 p-2 rounded-lg transition-colors text-xs font-semibold">Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
