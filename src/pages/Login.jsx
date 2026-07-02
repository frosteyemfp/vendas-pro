import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/");
  }

  return (
    <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
      <form onSubmit={handleLogin} className="p-6 bg-zinc-900 rounded-lg w-80 space-y-4">
        <h1 className="text-xl font-bold">Login</h1>

        <input
          className="w-full p-2 rounded bg-zinc-800"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-2 rounded bg-zinc-800"
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-indigo-600 p-2 rounded"
          type="submit"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}