import { useState } from "react";
import { supabase } from "../services/supabase";
import { Eye, EyeOff, Loader2, Mail, Lock, User } from "lucide-react";

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
          redirectTo: `${window.location.origin}/settings`,
        });
        if (err) throw err;
        setMessage("E-mail de redefinição enviado! Verifique sua caixa de entrada.");
      } else if (isRegister) {
        // Cadastro de Nova Conta com correção nos metadados da trigger
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              name: username,
              username: username 
            }
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

          {/* Erros */}
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
          <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
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
              setEmail("");
              setPassword("");
              setUsername("");
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