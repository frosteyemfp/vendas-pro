import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// CORREÇÃO: Usando "../" para sair de "routes" e entrar em "pages"
import Products from "../pages/Products";
import Sales from "../pages/Sales";
import Dashboard from "../pages/Dashboard";
import Settings from "../pages/Settings";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz redireciona para produtos */}
        <Route path="/" element={<Navigate to="/products" replace />} />

        {/* Rotas principais do sistema */}
        <Route path="/products" element={<Products />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />

        {/* Fallback 404 */}
        <Route path="*" element={
          <div className="flex h-screen w-screen items-center justify-center bg-white text-xs font-semibold text-gray-400">
            Página não encontrada.
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}