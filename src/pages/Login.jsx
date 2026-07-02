import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    
    // Pegando a resposta completa do Supabase (data)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (!error && data?.session?.user) {
      const user = data.session.user;
      
      // Salva o ID do usuário ou o metadata da empresa que você configurou no Supabase
      const companyId = user.user_metadata?.company_id || user.id;
      const companyName = user.user_metadata?.company_name || "Minha Empresa";

      localStorage.setItem('company_id', companyId);
      localStorage.setItem('company_name', companyName);

      navigate("/");
    } else {
      alert("Erro: " + error.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 transition-colors px-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xl">
        <h1 className="text-3xl font-black text-center text-slate-900 dark:text-white mb-6">Vendas Pro 🚀</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="E-mail" onChange={e => setEmail(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white" required />
          <input type="password" placeholder="Senha" onChange={e => setPassword(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white" required />
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-xl transition-colors">Entrar</button>
        </form>
      </div>
    </div>
  );
}