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
  Sliders 
} from "lucide-react";

export default function Settings() {
  const { companyId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Estados dos campos de configurações
  const [companyName, setCompanyName] = useState("");
  const [document, setDocument] = useState("");
  const [appTheme, setAppTheme] = useState("light");
  const [notifyStock, setNotifyStock] = useState(true);

  // Carrega as configurações atuais da empresa salvas no banco
  async function loadSettings() {
    try {
      setLoading(true);
      if (!companyId) return;

      const { data, error } = await supabase
        .from("companies") // Supondo que a tabela se chame 'companies'
        .select("*")
        .eq("id", companyId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // Ignora se não achar registro para não quebrar

      if (data) {
        setCompanyName(data.name || "");
        setDocument(data.document || "");
        setAppTheme(data.theme || "light");
        setNotifyStock(data.notify_low_stock ?? true);
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
  }, [companyId]);

  function showToast(message, type = "success") {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  }

  // Salva as alterações de volta no Supabase
  async function handleSaveSettings(e) {
    e.preventDefault();
    if (!companyId) return;

    try {
      setSubmitting(true);

      const payload = {
        name: companyName.trim(),
        document: document.trim(),
        theme: appTheme,
        notify_low_stock: notifyStock,
      };

      const { error } = await supabase
        .from("companies")
        .update(payload)
        .eq("id", companyId);

      if (error) throw error;

      showToast("Configurações atualizadas com sucesso!");
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

      {/* Alerta de Notificação Flutuante (Toast) */}
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
          
          {/* Header principal */}
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
            <form onSubmit={handleSaveSettings} className="space-y-6 animate-in fade-in duration-300">
              
              {/* Bloco 1: Perfil do Estabelecimento */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Dados do Estabelecimento</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">Documento / Identificador</label>
                    <input
                      type="text"
                      disabled={submitting}
                      value={document}
                      onChange={(e) => setDocument(e.target.value)}
                      placeholder="CNPJ ou ID Fiscal"
                      className="w-full p-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:border-black transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 2: Preferências Técnicas e de Interface */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                  <Sliders className="h-4 w-4 text-gray-400" />
                  <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Preferências Gerais</h2>
                </div>

                {/* Switch de Alerta do Estoque Baixo */}
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

                {/* Seletor de Tema Visual do App */}
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
                  disabled={submitting}
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
          )}

        </div>
      </main>
    </div>
  );
}