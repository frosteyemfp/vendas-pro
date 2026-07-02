import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Categories() {
  const { companyId } = useAuth();

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");

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

    if (!inputName) {
      alert("Digite o nome da categoria.");
      return;
    }

    if (!companyId) {
      alert("Company ID não encontrado.");
      return;
    }

    const { error } = await supabase.from("categories").insert([
      {
        name: inputName,
        company_id: companyId,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    fetchCategories();
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6 text-white">
          Categorias
        </h1>

        <form onSubmit={handleCreate} className="flex gap-2 mb-6">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2 rounded bg-zinc-800 text-white flex-1"
            placeholder="Nova categoria"
          />

          <button className="bg-indigo-600 text-white px-4 rounded">
            Criar
          </button>
        </form>

        <div className="space-y-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-3 bg-zinc-900 text-white rounded"
            >
              {c.name}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}