import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthPage from "./components/AuthPage";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import LoadingSpinner from "./components/LoadingSpinner";

// Componente interno que tem acesso ao contexto de auth
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading inicial (verificando sessão)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="text-gray-500 mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Se está autenticado, mostrar o chat
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="chat-container">
        <Sidebar />
        <ChatWindow />
      </div>
    </div>
  );
};

// Componente principal que provê o contexto
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}