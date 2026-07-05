import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  User, 
  LogOut, 
  Layers,
  Menu,
  X 
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false); // Controla a abertura no celular

  const menuItems = [
    { name: "Produtos", path: "/products", icon: Package, description: "Gestão do catálogo" },
    { name: "Vendas", path: "/sales", icon: ShoppingCart, description: "Histórico e PDV" },
    { name: "Rendimentos", path: "/dashboard", icon: BarChart3, description: "Análise de métricas" },
    { name: "Configurações", path: "/settings", icon: Settings, description: "Ajustes do sistema" },
  ];

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erro ao deslogar:", error.message);
    } else {
      window.location.href = "/"; 
    }
  }

  return (
    <>
      {/* BOTÃO HAMBÚRGUER (Apenas visível no celular) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-black rounded-lg flex items-center justify-center">
            <Layers className="h-3 w-3 text-white" />
          </div>
          <span className="font-bold text-xs tracking-tight text-gray-900">Vendas PRO</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* BACKGROUND ESCURO ABAIXO DO MENU (Fecha o menu ao clicar fora no celular) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-xs" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* MENU ASIDE (Responsivo) */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 p-6 z-40 select-none flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 pt-20 md:pt-6
      `}>
        {/* Header do Menu com a Versão do App (Oculto no topo do celular pra não duplicar) */}
        <div className="mb-8 px-2 hidden md:flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 bg-black rounded-lg flex items-center justify-center">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-gray-900">Vendas PRO</span>
              <span className="text-[10px] text-gray-400 font-medium">Versão 1.05</span>
            </div>
          </div>
        </div>

        {/* Links de Navegação Principais */}
        <nav className="space-y-1.5 flex-1">
          <div className="px-2 mb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Navegação</p>
          </div>
          
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)} // Fecha a sidebar ao clicar em um link no celular
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
                  isActive
                    ? "bg-gray-50 text-black font-bold shadow-2xs"
                    : "text-gray-400 hover:text-black hover:bg-gray-50/50"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-black rounded-r-md" />
                )}
                
                <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-black" : "text-gray-400 group-hover:text-black"}`} />
                
                <div className="flex flex-col text-left">
                  <span>{item.name}</span>
                  <span className={`text-[10px] font-normal tracking-normal ${isActive ? "text-gray-500" : "text-gray-400/70 hidden group-hover:block"}`}>
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer do Menu com Informações de Perfil Dinâmicas */}
        <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-gray-500" />
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-gray-900 truncate">{profile?.name || "Operador"}</span>
              <span className="text-[10px] text-gray-400 truncate">Conta ativa</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50/50 transition-colors w-full text-left group"
          >
            <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>
    </>
  );
}