import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// IMPORTAÇÕES REAIS DAS SUAS PÁGINAS
import Login from "../pages/Login";
import Products from "../pages/Products";
import Settings from "../pages/Settings";
import Sales from "../pages/Sales";         // Puxando a sua tela real de Vendas
import Dashboard from "../pages/Dashboard"; // Puxando a sua tela real de Rendimentos

// Componente para proteger rotas privadas
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-xs font-semibold text-gray-400">
        Carregando sistema...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-xs font-semibold text-gray-400">
        Iniciando sessão...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Raiz */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/products" replace /> : <Login />} 
        />

        {/* Rota de Produtos */}
        <Route 
          path="/products" 
          element={
            <PrivateRoute>
              <Products />
            </PrivateRoute>
          } 
        />

        {/* Rota de Vendas Real */}
        <Route 
          path="/sales" 
          element={
            <PrivateRoute>
              <Sales /> 
            </PrivateRoute>
          } 
        />

        {/* Rota de Rendimentos Real */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        
        {/* Rota de Configurações */}
        <Route 
          path="/settings" 
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } 
        />

        {/* Rota de segurança para caminhos inexistentes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}