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
  const [isOpen, setIsOpen] = useState(false);

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
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-chat-sidebar border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between px-4 z-50 transition-colors duration-200">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-zinc-950 dark:bg-zinc-100 rounded-lg flex items-center justify-center">
            <Layers className="h-3 w-3 text-white dark:text-zinc-950" />
          </div>
          <span className="font-bold text-xs tracking-tight text-zinc-900 dark:text-white">Vendas PRO</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* BACKGROUND ESCURO ABAIXO DO MENU */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/50 z-30 md:hidden backdrop-blur-xs" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* MENU ASIDE (Responsivo) */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white dark:bg-chat-sidebar border-r border-zinc-100 dark:border-zinc-800/80 p-6 z-40 select-none flex flex-col transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 pt-20 md:pt-6
      `}>
        {/* Header do Menu */}
        <div className="mb-8 px-2 hidden md:flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 bg-zinc-950 dark:bg-zinc-100 rounded-lg flex items-center justify-center">
              <Layers className="h-4 w-4 text-white dark:text-zinc-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white">Vendas PRO</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Versão 1.05</span>
            </div>
          </div>
        </div>

        {/* Links de Navegação Principais */}
        <nav className="space-y-1.5 flex-1">
          <div className="px-2 mb-2">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Navegação</p>
          </div>
          
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
                  isActive
                    ? "bg-zinc-50 dark:bg-zinc-800 text-zinc-950 dark:text-white font-bold shadow-2xs"
                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-zinc-950 dark:bg-zinc-100 rounded-r-md" />
                )}
                
                <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-zinc-950 dark:text-white" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-950 dark:group-hover:text-white"}`} />
                
                <div className="flex flex-col text-left">
                  <span>{item.name}</span>
                  <span className={`text-[10px] font-normal tracking-normal ${isActive ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-400/70 dark:text-zinc-500/70 hidden group-hover:block"}`}>
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer do Menu */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-8 w-8 rounded-full bg-zinc-50 dark:bg-chat-bg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">{profile?.name || "Operador"}</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">Conta ativa</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-colors w-full text-left group"
          >
            <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>
    </>
  );
}