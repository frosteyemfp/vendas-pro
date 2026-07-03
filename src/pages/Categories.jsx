import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Categories() {
  const { companyId } = useAuth();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  async function fetchCategories() {
    if (!companyId) return;
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("company_id", companyId);
    setCategories(data || []);
  }

  useEffect(() => {
    fetchCategories();
  }, [companyId]);

  async function handleCreate(e) {
    e.preventDefault();
    const inputName = name.trim();
    if (!inputName || !companyId) return;

    const { error } = await supabase.from("categories").insert([
      { name: inputName, company_id: companyId }
    ]);

    if (!error) {
      setName("");
      fetchCategories();
    }
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return;
    const { error } = await supabase
      .from("categories")
      .update({ name: editName.trim() })
      .eq("id", id);

    if (!error) {
      setEditingId(null);
      fetchCategories();
    }
  }

  async function handleDelete(id) {
    if (confirm("Tem certeza que deseja deletar esta categoria?")) {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (!error) fetchCategories();
    }
  }

  return (
    <div className="flex min-h-screen bg-brand-slate-50 text-brand-slate-800">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 ml-0 md:ml-64">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="border-b border-brand-slate-200 pb-5">
            <h1 className="text-2xl font-bold text-brand-slate-900">Categorias</h1>
          </div>

          <form onSubmit={handleCreate} className="flex gap-3 bg-white p-4 rounded-xl border border-brand-slate-200 shadow-sm">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-2.5 rounded-lg border border-brand-slate-200 bg-brand-slate-50 flex-1 text-sm"
              placeholder="Nova categoria..."
            />
            <button className="bg-brand-slate-900 text-white font-medium text-sm px-5 rounded-lg">Criar</button>
          </form>

          <div className="bg-white rounded-xl border border-brand-slate-200 divide-y divide-brand-slate-100 shadow-sm overflow-hidden">
            {categories.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between">
                {editingId === c.id ? (
                  <div className="flex gap-2 flex-1 mr-4">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="p-1.5 border rounded text-sm flex-1"
                    />
                    <button onClick={() => handleUpdate(c.id)} className="bg-emerald-600 text-white px-3 py-1 rounded text-xs">Salvar</button>
                    <button onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs">Cancelar</button>
                  </div>
                ) : (
                  <span className="font-medium text-sm">{c.name}</span>
                )}
                
                {editingId !== c.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingId(c.id); setEditName(c.name); }}
                      className="text-xs font-semibold text-brand-slate-600 hover:bg-brand-slate-100 px-2.5 py-1.5 rounded-lg border border-brand-slate-200"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100"
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}