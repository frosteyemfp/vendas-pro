import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

export default function Employees() {
  const { companyId, isAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");

  async function load() {
    if (!companyId) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("company_id", companyId);

    setUsers(data || []);
  }

  useEffect(() => {
    load();
  }, [companyId]);

  // ⚠️ versão segura (sem supabase.auth.admin)
  async function addEmployee() {
    alert(
      "Para criar usuários, use o painel do Supabase Auth (Users). Depois associe aqui."
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen bg-zinc-950 text-white">
        <Sidebar />
        <div className="p-6">
          Acesso negado.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <Sidebar />

      <div className="flex-1 p-6 space-y-4">

        <h1 className="text-xl font-bold">
          👥 Funcionários
        </h1>

        <div className="flex gap-2">
          <input
            className="bg-zinc-900 p-2 rounded"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            onClick={addEmployee}
            className="bg-green-600 px-4 rounded"
          >
            Adicionar
          </button>
        </div>

        <div className="bg-zinc-900 p-4 rounded">
          {users.map((u) => (
            <div key={u.id} className="border-b py-1">
              {u.email || u.id} — {u.role}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}