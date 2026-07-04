import { useState } from "react";
import { supabase } from "../services/supabase";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Chrome } from "lucide-react";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleAuth(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isForgotPassword) {
        // Recuperação de Senha (Envia e-mail)
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/configuracoes`,
        });
        if (err) throw err;
        setMessage("E-mail de redefinição enviado! Verifique sua caixa de entrada.");
      } else if (isRegister) {
        // Cadastro de Nova Conta
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: username } // Passa o nome para o trigger do banco
          }
        });
        if (err) throw err;
        setMessage("Conta criada com sucesso! Verifique seu e-mail para confirmar.");
      } else {
        // Login Convencional
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      console.error(err);
      setError(err.message === "Invalid login credentials" ? "Senha ou e-mail incorreto. Tente novamente." : err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err) {
      setError("Erro ao autenticar com o Google.");
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 text-black font-sans antialiased select-none">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-xl border border-gray-100 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            {isForgotPassword ? "Recuperar Senha" : isRegister ? "Criar Nova Conta" : "Entrar no Sistema"}
          </h1>
          <p className="text-xs text-gray-400 font-medium">
            {isForgotPassword ? "Insira seu e-mail para receber o link" : isRegister ? "Monte seu catálogo exclusivo hoje" : "Gerencie seu estoque com segurança"}
          </p>
        </div>

        {/* Mensagem de Sucesso Geral */}
        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] font-semibold text-emerald-600 text-center">
            {message}
          </div>
        )}

        {/* Formulário Principal */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nome de Usuário</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input 
                  type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nome ou apelido"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-black transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">E-mail corporativo</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-black transition-all"
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Senha de acesso</label>
                {!isRegister && (
                  <button type="button" onClick={() => { setIsForgotPassword(true); setError(""); }} className="text-[10px] font-bold text-gray-400 hover:text-black">Esqueceu?</button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input 
                  type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-black transition-all"
                />
                <button 
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* AVISO EM VERMELHO MINIMALISTA PEDIDO */}
          {error && (
            <p className="text-[11px] font-medium text-red-500 pl-1 animate-pulse">
              {error}
            </p>
          )}

          <button 
            type="submit" disabled={loading}
            className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>{isForgotPassword ? "Enviar Link" : isRegister ? "Cadastrar Conta" : "Entrar"}</span>
          </button>
        </form>

        {/* Separador */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="flex-shrink mx-3 text-[10px] font-bold text-gray-300 uppercase">ou</span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        {/* Login com Google */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs"
        >
          <Chrome className="h-4 w-4 text-red-500 fill-red-500" />
          <span>Entrar direto com o Google</span>
        </button>

        {/* Alternador de Modo inferior */}
        <div className="text-center">
          <button 
            type="button" 
            onClick={() => {
              setIsRegister(!isRegister);
              setIsForgotPassword(false);
              setError("");
              setMessage("");
            }} 
            className="text-xs font-bold text-gray-400 hover:text-black transition-colors"
          >
            {isForgotPassword ? "Voltar para o Login" : isRegister ? "Já possui uma conta? Faça Login" : "Não tem conta? Cadastre-se gratuitamente"}
          </button>
        </div>

      </div>
    </div>
  );
}