import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { 
  Settings as SettingsIcon, 
  Building2, 
  ShieldCheck, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Save, 
  Sliders,
  User,
  Key,
  UploadCloud
} from "lucide-react";

export default function Settings() {
  const { companyId, user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [companyName, setCompanyName] = useState("");
  const [appTheme, setAppTheme] = useState("light");
  const [notifyStock, setNotifyStock] = useState(true);

  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [showPasswordResetForm, setShowPasswordResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowPasswordResetForm(true);
        showToast("Link validado! Digite sua nova senha abaixo.", "success");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const localTheme = localStorage.getItem("theme") || "light";
    setAppTheme(localTheme);
    if (localTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  function handleThemeChange(newTheme) {
    setAppTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  async function loadSettings() {
    try {
      setLoading(true);
      if (profile) {
        setUsername(profile.name || "");
        setAvatarUrl(profile.avatar_url || "");
      }
      if (!companyId) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      if (data) setCompanyName(data.name || "");
    } catch (err) {
      console.error(err);
      showToast("Não foi possível carregar os parâmetros.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, [companyId, profile]);

  function showToast(message, type = "success") {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  }

  async function handleUploadAvatar(e) {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `avatar-${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("products") 
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      showToast("Foto carregada! Clique em Salvar.");
    } catch (err) {
      showToast("Não foi possível carregar a imagem.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleResetPassword() {
    try {
      setSubmitting(true);
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.href,
      });
      if (error) throw error;
      showToast("E-mail enviado! Verifique sua caixa de entrada.");
    } catch (err) {
      showToast("Falha ao solicitar troca de senha.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmNewPassword(e) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast("Mínimo de 6 caracteres.", "error");
      return;
    }
    try {
      setSubmitting(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast("Senha atualizada!");
      setNewPassword("");
      setShowPasswordResetForm(false);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let currentCompanyId = companyId;

      if (!currentCompanyId) {
        const { data: newCompany, error: insertCompanyError } = await supabase
          .from("companies")
          .insert({ name: companyName.trim() || "Minha Loja", id: user?.id })
          .select().single();

        if (insertCompanyError) throw insertCompanyError;
        currentCompanyId = newCompany.id;
      } else {
        const { error: companyError } = await supabase
          .from("companies")
          .update({ name: companyName.trim() })
          .eq("id", currentCompanyId);
        if (companyError) throw companyError;
      }

      if (user?.id) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ name: username.trim(), avatar_url: avatarUrl, company_id: currentCompanyId })
          .eq("id", user.id);
        if (profileError) throw profileError;
      }

      showToast("Configurações salvas!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      showToast("Falha ao salvar as modificações.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // Fundo dinâmico: branco no claro, cinza-chatgpt no escuro
    <div className="flex min-h-screen bg-neutral-50 dark:bg-[#212121] text-zinc-900 dark:text-[#ececec] font-sans antialiased transition-colors duration-200">
      <Sidebar />

      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold shadow-premium-md ${
          toast.type === "error" 
            ? "bg-red-500 text-white" 
            : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950"
        }`}>
          {toast.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* CORREÇÃO MOBILE: 'pt-24' garante que o menu superior dos 3 pontos nunca tampe o conteúdo */}
      <main className="flex-1 p-4 md:p-10 ml-0 md:ml-64 pt-24 md:pt-10 pb-24 transition-all duration-200">
        <div className="max-w-2xl mx-auto space-y-6">
          
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-zinc-950 dark:text-white flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 md:h-6 md:w-6 text-zinc-800 dark:text-zinc-200" />
              <span>Configurações</span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Gerencie suas preferências de conta e aplicativo</p>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-[#2f2f2f] border border-zinc-200/60 dark:border-zinc-700/50 rounded-2xl p-6 space-y-6 animate-pulse">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
              <div className="h-9 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
            </div>
          ) : (
            <div className="space-y-6">
              
              {showPasswordResetForm && (
                <form onSubmit={handleConfirmNewPassword} className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-amber-500/10">
                    <Key className="h-4 w-4 text-amber-500" />
                    <h2 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Definir Nova Senha</h2>
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 dígitos"
                      className="w-full p-2.5 bg-white dark:bg-[#212121] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs dark:text-white focus:outline-none"
                    />
                    <button type="submit" className="bg-amber-500 text-white text-xs font-bold py-2 px-4 rounded-xl">Salvar Senha</button>
                  </div>
                </form>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                
                {/* Bloco: Usuário */}
                <div className="bg-white dark:bg-[#2f2f2f] border border-zinc-200/60 dark:border-zinc-700/50 rounded-2xl p-4 md:p-6 shadow-premium space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-700/40">
                    <User className="h-4 w-4 text-zinc-400" />
                    <h2 className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">Perfil de Usuário</h2>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <User className="h-5 w-5 text-zinc-400" />}
                    </div>
                    <label className="text-center px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                      <span>Alterar Foto</span>
                      <input type="file" accept="image/*" disabled={uploading} onChange={handleUploadAvatar} className="hidden" />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Seu Nome</label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2.5 bg-zinc-50 dark:bg-[#212121] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">E-mail (Login)</label>
                      <input type="text" disabled value={user?.email || ""} className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-400 dark:text-zinc-500 outline-none" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button type="button" onClick={handleResetPassword} className="text-xs text-zinc-500 dark:text-zinc-400 hover:underline flex items-center gap-1.5">
                      <Key className="h-3 w-3" /> Alterar minha senha por e-mail
                    </button>
                  </div>
                </div>

                {/* Bloco: Estabelecimento */}
                <div className="bg-white dark:bg-[#2f2f2f] border border-zinc-200/60 dark:border-zinc-700/50 rounded-2xl p-4 md:p-6 shadow-premium space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-700/40">
                    <Building2 className="h-4 w-4 text-zinc-400" />
                    <h2 className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">Estabelecimento</h2>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Nome Comercial do Negócio</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full p-2.5 bg-zinc-50 dark:bg-[#212121] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Bloco: Preferências */}
                <div className="bg-white dark:bg-[#2f2f2f] border border-zinc-200/60 dark:border-zinc-700/50 rounded-2xl p-4 md:p-6 shadow-premium space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-700/40">
                    <Sliders className="h-4 w-4 text-zinc-400" />
                    <h2 className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">Sistema</h2>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-xs font-medium">Alertas de Estoque Crítico</p>
                      <p className="text-[10px] text-zinc-400">Notificar quando os produtos estiverem acabando</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifyStock(!notifyStock)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors ${notifyStock ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notifyStock ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-700/40">
                    <div>
                      <p className="text-xs font-medium">Tema do Painel</p>
                      <p className="text-[10px] text-zinc-400">Escolha a aparência da sua interface</p>
                    </div>
                    <select
                      value={appTheme}
                      onChange={(e) => handleThemeChange(e.target.value)}
                      className="p-1.5 bg-zinc-50 dark:bg-[#212121] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none text-zinc-800 dark:text-white font-medium"
                    >
                      <option value="light">Modo Claro</option>
                      <option value="dark">Modo Escuro</option>
                    </select>
                  </div>
                </div>

                {/* Ações Inferiores */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mr-auto">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Configurações sincronizadas com criptografia Supabase.</span>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 font-semibold text-xs px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    <span>Salvar Alterações</span>
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}