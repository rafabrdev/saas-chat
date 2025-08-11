import React, { useEffect } from 'react';
import { useAuth } from './hooks/useAuth.js';
import { AuthProvider } from './components/providers/AuthProvider';
import { ToastProvider } from './components/ui/Toast';
import AuthPage from './components/AuthPage';
import ChatWindow from './components/ChatWindow';
import Sidebar from './components/Sidebar';
import socket from './lib/socket';

// Componente que gerencia a autenticação
function AuthenticatedApp() {
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    // Se não está autenticado, garantir que o socket está desconectado
    if (!isAuthenticated || !token) {
      if (socket.connected) {
        console.log('Desconectando socket - sem autenticação');
        socket.disconnect();
      }
      // Limpar qualquer token remanescente
      socket.auth = {};
    } else {
      // Se está autenticado, atualizar o token do socket
      socket.auth = { token };
      console.log('Token atualizado no socket');
    }
  }, [isAuthenticated, token]);

  // Se não está autenticado, mostrar página de login
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Se está autenticado, mostrar o chat
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1 h-full overflow-hidden">
        <div className="hidden md:flex md:w-64 lg:w-80 flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}

// Componente principal com providers
export default function AppRouter() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthenticatedApp />
      </ToastProvider>
    </AuthProvider>
  );
}
