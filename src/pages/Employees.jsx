import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

export default function Employees() {
  const { companyId } = useAuth();
  const [users, setUsers] = useState([]);

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

  return (
    <div className="flex">
      <Sidebar />

      <div className="p-6 w-full">
        <h1 className="text-2xl font-bold mb-4">
          👥 Funcionários
        </h1>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded">
          {users.map(u => (
            <div key={u.id} className="border-b p-2">
              <p>ID: {u.id}</p>
              <p>Role: {u.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}