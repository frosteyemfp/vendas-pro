import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Categories() {
  const { companyId } = useAuth();
  const [categories, setCategories] = useState([]);

  async function fetchCategories() {
    if (!companyId) return;
    const { data } = await supabase.from("categories").select("*").eq("company_id", companyId);
    if (data) setCategories(data);
  }

  async function handleCreate(e) {
    e.preventDefault();
    
    // Captura o texto direto do input do HTML para evitar travamento de estado assíncrono
    const inputName = e.target.elements.categoryName.value.trim();
    
    if (!inputName) return alert("Por favor, digite o nome da categoria!");
    if (!companyId) return alert("Erro de sessão: ID da empresa não encontrado. Recarregue a página.");

    const { error } = await supabase.from("categories").insert([{ name: inputName, company_id: companyId }]);
    
    if (!error) { 
      e.target.reset(); // Limpa o formulário na hora
      fetchCategories(); 
    } else {
      alert("Erro ao adicionar no Supabase: " + error.message);
    }
  }

  async function handleDeleteCategory(id) {
    if (!confirm("Tem certeza que deseja excluir esta categoria? Isso irá apagar os produtos vinculados a ela.")) return;
    try {
      await supabase.from("products").delete().eq("category_id", id);
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (!error) {
        fetchCategories();
        alert("Categoria removida! 🗑️");
      } else { throw error; }
    } catch (err) { alert(err.message); }
  }

  useEffect(() => { fetchCategories(); }, [companyId]);

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto pt-16 md:pt-10">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2">🏷️ Categorias</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">Organize seus produtos por setor comercial</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleCreate} className="bg-slate-50 dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm h-fit">
            <h2 className="text-lg font-bold mb-4">Nova Categoria</h2>
            <div className="space-y-4">
              <input name="categoryName" placeholder="Nome da categoria" className="w-full p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold p-2.5 rounded-lg text-sm transition-colors">Adicionar</button>
            </div>
          </form>

          <div className="lg:col-span-2 bg-slate-50 dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Setores Cadastrados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map(c => (
                <div key={c.id} className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 font-medium text-sm flex justify-between items-center shadow-sm">
                  <span>{c.name}</span>
                  <button onClick={() => handleDeleteCategory(c.id)} className="bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-2 py-1 rounded text-xs transition-colors">Excluir</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
