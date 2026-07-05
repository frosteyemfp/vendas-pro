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

  // Estado do campo de configurações da Empresa
  const [companyName, setCompanyName] = useState("");
  const [appTheme, setAppTheme] = useState("light");
  const [notifyStock, setNotifyStock] = useState(true);

  // Perfil do Usuário
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Estado para controlar a exibição dos campos de Nova Senha de forma visível
  const [showPasswordResetForm, setShowPasswordResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // --- ESCUTA SE O USUÁRIO VEIO PELO LINK DO ESQUECI A SENHA ---
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowPasswordResetForm(true);
        showToast("Link validado! Digite sua nova senha no campo abaixo.", "success");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- CONTROLE EM TEMPO REAL DO MODO ESCURO ---
  useEffect(() => {
    const localTheme = localStorage.getItem("theme") || "light";
    setAppTheme(localTheme);
    if (localTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Função para mudar o tema visual imediatamente na tela
  function handleThemeChange(newTheme) {
    setAppTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  // Carrega as configurações da empresa e dados do perfil
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

      if (data) {
        setCompanyName(data.name || "");
      }
    } catch (err) {
      console.error("Erro ao carregar configurações:", err);
      showToast("Não foi possível carregar os parâmetros do sistema.", "error");
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

  // Upload direto para o Storage do Supabase
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
      showToast("Foto carregada! Clique em Salvar para fixar as mudanças.");
    } catch (err) {
      console.error(err);
      showToast("Não foi possível carregar a imagem de perfil.", "error");
    } finally {
      setUploading(false);
    }
  }

  // Enviar link de redefinição de senha por e-mail
  async function handleResetPassword() {
    try {
      setSubmitting(true);
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.href,
      });
      if (error) throw error;
      showToast("E-mail de redefinição enviado! Verifique sua caixa de entrada.");
    } catch (err) {
      showToast("Falha ao solicitar troca de senha.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Executa a troca definitiva da senha no servidor
  async function handleConfirmNewPassword(e) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast("A senha precisa ter no mínimo 6 caracteres.", "error");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      showToast("Senha updated com sucesso!");
      setNewPassword("");
      setShowPasswordResetForm(false);
    } catch (err) {
      showToast("Erro ao atualizar a senha: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Salva as alterações de Perfil e Empresa (Corrigido o problema de Foreign Key)
  async function handleSaveSettings(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      let currentCompanyId = companyId;

      if (!currentCompanyId) {
        const { data: newCompany, error: insertCompanyError } = await supabase
          .from("companies")
          .insert({ 
            name: companyName.trim() || "Minha Loja",
            id: user?.id 
          })
          .select()
          .single();

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
          .update({ 
            name: username.trim(),
            avatar_url: avatarUrl,
            company_id: currentCompanyId 
          })
          .eq("id", user.id);

        if (profileError) throw profileError;
      }

      showToast("Configurações salvas com sucesso!");
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error("Erro ao salvar:", err);
      showToast("Falha ao salvar as modificações no servidor.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-brand-slate-50 dark:bg-brand-slate-950 text-brand-slate-900 dark:text-brand-slate-100 font-sans antialiased select-none transition-colors duration-300">
      <Sidebar />

      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold shadow-premium-lg transition-all duration-300 ${
          toast.type === "error" 
            ? "bg-brand-accent-rose/10 text-brand-accent-rose border border-brand-accent-rose/20 dark:bg-brand-accent-rose/20" 
            : "bg-brand-slate-900 text-white border border-brand-slate-800 dark:bg-brand-slate-100 dark:text-brand-slate-950"
        }`}>
          {toast.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      <main className="flex-1 p-4 md:p-10 ml-0 md:ml-64 pb-32 md:pb-10 transition-all duration-300">
        <div className="max-w-3xl mx-auto space-y-6">
          
          <div className="pt-14 md:pt-0">
            <h1 className="text-xl md:text-2xl font-bold text-brand-slate-900 dark:text-white flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 md:h-6 md:w-6 text-brand-slate-800 dark:text-brand-slate-200 shrink-0" />
              <span>Configurações</span>
            </h1>
            <p className="text-[11px] md:text-xs text-brand-slate-400 dark:text-brand-slate-500 font-medium">Controle os parâmetros de comportamento do seu aplicativo</p>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-brand-slate-900 border border-brand-slate-100 dark:border-brand-slate-800/60 rounded-2xl p-6 md:p-8 space-y-6 animate-pulse shadow-premium">
              <div className="h-4 bg-brand-slate-100 dark:bg-brand-slate-800 rounded w-1/3" />
              <div className="space-y-3">
                <div className="h-9 bg-brand-slate-50 dark:bg-brand-slate-800/50 rounded-xl" />
                <div className="h-9 bg-brand-slate-50 dark:bg-brand-slate-800/50 rounded-xl" />
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {showPasswordResetForm && (
                <form onSubmit={handleConfirmNewPassword} className="bg-brand-accent-amber/5 dark:bg-brand-accent-amber/10 border border-brand-accent-amber/20 rounded-2xl p-4 md:p-6 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-brand-accent-amber/10">
                    <Key className="h-4 w-4 text-brand-accent-amber" />
                    <h2 className="text-xs font-bold text-brand-accent-amber uppercase tracking-wider">Definir Nova Senha de Acesso</h2>
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <label className="text-xs font-semibold text-brand-slate-700 dark:text-brand-slate-300">Nova Senha</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 dígitos"
                        className="w-full p-2.5 bg-white dark:bg-brand-slate-850 border border-brand-slate-200 dark:border-brand-slate-800 rounded-xl text-xs font-medium focus:outline-none dark:text-white"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full sm:w-auto bg-brand-accent-amber text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                      >
                        {submitting ? "Alterando..." : "Salvar Senha"}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                
                {/* Bloco: Perfil da Conta do Usuário */}
                <div className="bg-white dark:bg-brand-slate-900 border border-brand-slate-100 dark:border-brand-slate-850 rounded-2xl p-4 md:p-6 shadow-premium space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-brand-slate-50 dark:border-brand-slate-800">
                    <User className="h-4 w-4 text-brand-slate-400 dark:text-brand-slate-500" />
                    <h2 className="text-xs font-bold text-brand-slate-800 dark:text-brand-slate-200 uppercase tracking-wider">Meu Perfil de Usuário</h2>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pb-2">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border border-brand-slate-200 dark:border-brand-slate-800 bg-brand-slate-50 dark:bg-brand-slate-800 flex items-center justify-center shrink-0">
                      {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <User className="h-6 w-6 text-brand-slate-400" />}
                    </div>
                    <label className="w-full sm:w-auto text-center px-3 py-2 border border-brand-slate-200 dark:border-brand-slate-800 rounded-xl text-xs font-bold text-brand-slate-600 dark:text-brand-slate-400 hover:bg-brand-slate-50 dark:hover:bg-brand-slate-800 cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-slate-400" /> : <UploadCloud className="h-3.5 w-3.5" />}
                      <span>Alterar Foto de Perfil</span>
                      <input type="file" accept="image/*" disabled={uploading || submitting} onChange={handleUploadAvatar} className="hidden" />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brand-slate-700 dark:text-brand-slate-300">Nome de Usuário (Apelido)</label>
                      <input
                        type="text"
                        required
                        disabled={submitting}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ex: André Silva"
                        className="w-full p-2.5 bg-brand-slate-50/50 dark:bg-brand-slate-850 border border-brand-slate-200 dark:border-brand-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:bg-white dark:focus:bg-brand-slate-900 focus:border-brand-slate-900 dark:focus:border-brand-slate-100 transition-all dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brand-slate-700 dark:text-brand-slate-300">E-mail de Login (Imutável)</label>
                      <input
                        type="text"
                        disabled
                        value={user?.email || ""}
                        className="w-full p-2.5 bg-brand-slate-100 dark:bg-brand-slate-800 border border-brand-slate-200 dark:border-brand-slate-800 rounded-xl text-xs font-medium text-brand-slate-400 dark:text-brand-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Segurança / Senha por E-mail */}
                  <div className="pt-4 border-t border-brand-slate-50 dark:border-brand-slate-800 space-y-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-brand-slate-700 dark:text-brand-slate-300">Segurança da Conta</span>
                      <span className="text-[10px] text-brand-slate-400 dark:text-brand-slate-500">Clique para enviar um link de alteração de senha segura diretamente para o seu e-mail.</span>
                    </div>
                    <button
                      type="button"
                      disabled={submitting || uploading}
                      onClick={handleResetPassword}
                      className="w-full sm:w-auto py-2.5 px-4 border border-brand-slate-200 dark:border-brand-slate-800 bg-white dark:bg-brand-slate-900 text-brand-slate-700 dark:text-brand-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 hover:bg-brand-slate-50 dark:hover:bg-brand-slate-800 disabled:opacity-50"
                    >
                      <Key className="h-3.5 w-3.5 text-brand-slate-400 dark:text-brand-slate-500" />
                      <span>Solicitar Nova Senha por E-mail</span>
                    </button>
                  </div>
                </div>

                {/* Bloco: Perfil do Estabelecimento */}
                <div className="bg-white dark:bg-brand-slate-900 border border-brand-slate-100 dark:border-brand-slate-850 rounded-2xl p-4 md:p-6 shadow-premium space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-brand-slate-50 dark:border-brand-slate-800">
                    <Building2 className="h-4 w-4 text-brand-slate-400 dark:text-brand-slate-500" />
                    <h2 className="text-xs font-bold text-brand-slate-800 dark:text-brand-slate-200 uppercase tracking-wider">Dados do Estabelecimento</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-brand-slate-700 dark:text-brand-slate-300">Nome Comercial da Empresa / Loja</label>
                      <input
                        type="text"
                        required
                        disabled={submitting}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Digite o nome da sua loja"
                        className="w-full p-2.5 bg-brand-slate-50/50 dark:bg-brand-slate-850 border border-brand-slate-200 dark:border-brand-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:bg-white dark:focus:bg-brand-slate-900 focus:border-brand-slate-900 dark:focus:border-brand-slate-100 transition-all dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloco: Preferências Técnicas e de Interface */}
                <div className="bg-white dark:bg-brand-slate-900 border border-brand-slate-100 dark:border-brand-slate-850 rounded-2xl p-4 md:p-6 shadow-premium space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-brand-slate-50 dark:border-brand-slate-800">
                    <Sliders className="h-4 w-4 text-brand-slate-400 dark:text-brand-slate-500" />
                    <h2 className="text-xs font-bold text-brand-slate-800 dark:text-brand-slate-200 uppercase tracking-wider">Preferências Gerais</h2>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex flex-col pr-2">
                      <span className="text-xs font-semibold text-brand-slate-700 dark:text-brand-slate-300">Notificações de Estoque Mínimo</span>
                      <span className="text-[10px] text-brand-slate-400 dark:text-brand-slate-500">Exibir avisos em tela quando produtos estiverem esgotando</span>
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setNotifyStock(!notifyStock)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${
                        notifyStock ? "bg-brand-slate-900 dark:bg-brand-slate-100" : "bg-brand-slate-200 dark:bg-brand-slate-800"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white dark:bg-brand-slate-950 shadow-premium transform transition-transform duration-200 ${
                        notifyStock ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-brand-slate-50 dark:border-brand-slate-800">
                    <div className="flex flex-col pr-2">
                      <span className="text-xs font-semibold text-brand-slate-700 dark:text-brand-slate-300">Tema da Interface</span>
                      <span className="text-[10px] text-brand-slate-400 dark:text-brand-slate-500">Escolha o visual padrão do painel de controle</span>
                    </div>
                    <select
                      disabled={submitting}
                      value={appTheme}
                      onChange={(e) => handleThemeChange(e.target.value)}
                      className="p-2 bg-brand-slate-50 dark:bg-brand-slate-850 border border-brand-slate-100 dark:border-brand-slate-800 rounded-xl text-xs font-semibold focus:outline-none min-w-[120px] max-w-[140px] dark:text-white"
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Escuro</option>
                    </select>
                  </div>
                </div>

                {/* Botão de Envio Inferior */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-brand-slate-400 dark:text-brand-slate-500 font-medium mr-auto text-center sm:text-left">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-slate-400 dark:text-brand-slate-600 shrink-0" />
                    <span>Seus dados estão protegidos criptograficamente de ponta a ponta.</span>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="w-full sm:w-auto bg-brand-slate-900 hover:bg-brand-slate-800 text-white dark:bg-brand-slate-100 dark:text-brand-slate-950 dark:hover:bg-brand-slate-200 font-bold text-xs px-5 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-premium-md"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Salvando alterações...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Salvar Configurações</span>
                      </>
                    )}
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