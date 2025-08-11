import React from 'react';
import { 
  WifiIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const ConnectionStatus = ({ status, error, onRetry }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: WifiIcon,
          text: 'Conectado',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      case 'connecting':
        return {
          icon: ArrowPathIcon,
          text: 'Conectando...',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          animate: true,
        };
      case 'disconnected':
      default:
        return {
          icon: ExclamationTriangleIcon,
          text: error || 'Desconectado',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (status === 'connected' && !error) {
    // Não mostrar status quando conectado e sem erro
    return null;
  }

  return (
    <div className={clsx(
      'px-3 py-2 rounded-lg border flex items-center gap-2 text-sm',
      config.color,
      config.bgColor,
      config.borderColor
    )}>
      <Icon className={clsx('w-4 h-4', config.animate && 'animate-spin')} />
      <span>{config.text}</span>
      
      {status === 'disconnected' && onRetry && (
        <button
          onClick={onRetry}
          className="ml-2 px-2 py-1 bg-red-100 hover:bg-red-200 rounded text-xs"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;