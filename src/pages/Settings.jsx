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

  // Carrega as configurações da empresa e dados do perfil
  async function loadSettings() {
    try {
      setLoading(true);
      
      if (profile) {
        setUsername(profile.name || "");
        setAvatarUrl(profile.avatar_url || "");
      }

      if (!companyId) return;

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

  // CORREÇÃO: Mudado de "avatars" para "products" para bater com o seu Bucket do Supabase
  async function handleUploadAvatar(e) {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;

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
      showToast("Não foi possível carregar a imagem de perfil. Verifique as permissões do Bucket.", "error");
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

      showToast("Senha atualizada com sucesso!");
      setNewPassword("");
      setShowPasswordResetForm(false);
    } catch (err) {
      showToast("Erro ao atualizar a senha: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Salva alterações de Perfil e Empresa no Supabase
  async function handleSaveSettings(e) {
    e.preventDefault();

    try {
      setSubmitting(true);

      if (user?.id) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ 
            name: username.trim(),
            avatar_url: avatarUrl // Fixa a URL da imagem de perfil salva no banco
          })
          .eq("id", user.id);

        if (profileError) throw profileError;
      }

      if (companyId) {
        const payload = {
          name: companyName.trim()
        };

        const { error: companyError } = await supabase
          .from("companies")
          .update(payload)
          .eq("id", companyId);

        if (companyError) throw companyError;
      }

      showToast("Configurações updated com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar:", err);
      showToast("Falha ao salvar as modificações no servidor.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-black font-sans antialiased select-none">
      <Sidebar />

      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
          toast.type === "error" ? "bg-red-50 text-red-600 border border-red-100" : "bg-zinc-900 text-white"
        }`}>
          {toast.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      <main className="flex-1 p-6 md:p-10 ml-0 md:ml-64 transition-all duration-300">
        <div className="max-w-3xl mx-auto space-y-6">
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <SettingsIcon className="h-6 w-6 text-black shrink-0" />
              <span>Configurações</span>
            </h1>
            <p className="text-xs text-gray-400 font-medium">Controle os parâmetros de comportamento do seu aplicativo</p>
          </div>

          {loading ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-8 space-y-6 animate-pulse shadow-2xs">
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="space-y-3">
                <div className="h-9 bg-gray-50 rounded-xl" />
                <div className="h-9 bg-gray-50 rounded-xl" />
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* FORMULÁRIO DE NOVA SENHA CASO VENHA DO LINK DE RECUPERAÇÃO */}
              {showPasswordResetForm && (
                <form onSubmit={handleConfirmNewPassword} className="bg-amber-50/60 border border-amber-200 rounded-3xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
                    <Key className="h-4 w-4 text-amber-600" />
                    <h2 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Definir Nova Senha de Acesso</h2>
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <label className="text-xs font-semibold text-amber-900">Nova Senha</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 dígitos"
                        className="flex-1 p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-600 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 rounded-xl transition-all disabled:opacity-50"
                      >
                        {submitting ? "Alterando..." : "Salvar Senha"}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                
                {/* Bloco: Perfil da Conta do Usuário */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                    <User className="h-4 w-4 text-gray-400" />
                    <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Meu Perfil de Usuário</h2>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-2">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                      {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <User className="h-6 w-6 text-gray-400" />}
                    </div>
                    <label className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer flex items-center gap-1.5 transition-all">
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" /> : <UploadCloud className="h-3.5 w-3.5" />}
                      <span>Alterar Foto de Perfil</span>
                      <input type="file" accept="image/*" disabled={uploading || submitting} onChange={handleUploadAvatar} className="hidden" />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Nome de Usuário (Apelido)</label>
                      <input
                        type="text"
                        required
                        disabled={submitting}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ex: André Silva"
                        className="w-full p-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:border-black transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">E-mail de Login (Imutável)</label>
                      <input
                        type="text"
                        disabled
                        value={user?.email || ""}
                        className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-medium text-gray-400 outline-none"
                      />
                    </div>
                  </div>

                  {/* Segurança / Senha por E-mail */}
                  <div className="pt-4 border-t border-gray-50 space-y-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-700">Segurança da Conta</span>
                      <span className="text-[10px] text-gray-400">Clique para enviar um link de alteração de senha segura diretamente para o seu e-mail.</span>
                    </div>
                    <button
                      type="button"
                      disabled={submitting || uploading}
                      onClick={handleResetPassword}
                      className="py-2 px-4 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Key className="h-3.5 w-3.5 text-gray-400" />
                      <span>Solicitar Nova Senha por E-mail</span>
                    </button>
                  </div>
                </div>

                {/* Bloco: Perfil do Estabelecimento */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Dados do Estabelecimento</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Nome Comercial da Empresa</label>
                      <input
                        type="text"
                        disabled={submitting}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ex: Minha Loja Pro LTDA"
                        className="w-full p-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:border-black transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloco: Preferências Técnicas e de Interface */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                    <Sliders className="h-4 w-4 text-gray-400" />
                    <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Preferências Gerais</h2>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-700">Notificações de Estoque Mínimo</span>
                      <span className="text-[10px] text-gray-400">Exibir avisos em tela quando produtos estiverem esgotando</span>
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setNotifyStock(!notifyStock)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                        notifyStock ? "bg-black" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 ${
                          notifyStock ? "translate-x-4" : "translate-x-0"
                        }`}
                    />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-700">Tema da Interface</span>
                      <span className="text-[10px] text-gray-400">Escolha o visual padrão do painel de controle</span>
                    </div>
                    <select
                      disabled={submitting}
                      value={appTheme}
                      onChange={(e) => setAppTheme(e.target.value)}
                      className="p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none min-w-[120px]"
                    >
                      <option value="light">Claro (Padrão)</option>
                      <option value="dark">Escuro (Breve)</option>
                    </select>
                  </div>
                </div>

                {/* Botão de Envio Inferior */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium mr-auto">
                    <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Seus dados estão protegidos criptograficamente de ponta a ponta.</span>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="bg-black text-white font-bold text-xs px-5 py-3 rounded-xl hover:bg-zinc-800 active:scale-99 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md"
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