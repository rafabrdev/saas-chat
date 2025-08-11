import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  UserCircleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const ChatHeader = ({ connectionStatus, onlineUsersCount = 0 }) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Online';
      case 'connecting':
        return 'Conectando...';
      default:
        return 'Offline';
    }
  };

  return (
    <header className="px-6 py-4 border-b bg-white flex items-center justify-between">
      {/* Info do Chat */}
      <div>
        <div className="text-sm text-gray-500">Atendimento</div>
        <div className="font-semibold text-gray-900">
          {user?.company?.name || 'Chat Corporativo'}
        </div>
        {onlineUsersCount > 0 && (
          <div className="text-xs text-gray-400">
            {onlineUsersCount} usuário{onlineUsersCount !== 1 ? 's' : ''} online
          </div>
        )}
      </div>

      {/* Status e Menu do Usuário */}
      <div className="flex items-center gap-4">
        {/* Status de Conexão */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`} />
          <span className="text-xs text-gray-600">{getConnectionStatusText()}</span>
        </div>

        {/* Menu do Usuário */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
            </div>
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border z-20">
                {/* User Info */}
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user?.name}</div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                    </div>
                  </div>
                  
                  {/* Company Info */}
                  <div className="mt-3 p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2 text-sm">
                      <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{user?.company?.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Plano: <span className="capitalize">{user?.company?.plan?.toLowerCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors text-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                    Configurações
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;