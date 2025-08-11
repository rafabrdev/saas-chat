import React from 'react';
import clsx from 'clsx';
import { 
  WifiIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';
import { CONNECTION_STATES } from '../../hooks/useSocket';
import LoadingSpinner from './LoadingSpinner';

export function ConnectionStatus({ 
  connectionState, 
  reconnectCount = 0, 
  className,
  compact = false 
}) {
  const getStatusConfig = () => {
    switch (connectionState) {
      case CONNECTION_STATES.CONNECTED:
        return {
          icon: WifiIcon,
          text: compact ? 'Online' : 'Conectado',
          className: 'text-green-600 bg-green-50 border-green-200',
          iconClassName: 'text-green-500'
        };
      
      case CONNECTION_STATES.CONNECTING:
        return {
          icon: LoadingSpinner,
          text: compact ? 'Conectando...' : 'Conectando ao servidor...',
          className: 'text-blue-600 bg-blue-50 border-blue-200',
          iconClassName: 'text-blue-500'
        };
      
      case CONNECTION_STATES.RECONNECTING:
        return {
          icon: ArrowPathIcon,
          text: compact 
            ? `Reconectando (${reconnectCount})` 
            : `Reconectando... Tentativa ${reconnectCount}`,
          className: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          iconClassName: 'text-yellow-500 animate-spin'
        };
      
      case CONNECTION_STATES.ERROR:
        return {
          icon: ExclamationTriangleIcon,
          text: compact ? 'Erro' : 'Erro de conexão',
          className: 'text-red-600 bg-red-50 border-red-200',
          iconClassName: 'text-red-500'
        };
      
      case CONNECTION_STATES.DISCONNECTED:
      default:
        return {
          icon: WifiIcon,
          text: compact ? 'Offline' : 'Desconectado',
          className: 'text-gray-600 bg-gray-50 border-gray-200',
          iconClassName: 'text-gray-400'
        };
    }
  };

  const { icon: Icon, text, className: statusClassName, iconClassName } = getStatusConfig();

  if (compact) {
    return (
      <div className={clsx(
        'flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border',
        statusClassName,
        className
      )}>
        <Icon className={clsx('w-3 h-3', iconClassName)} />
        <span>{text}</span>
      </div>
    );
  }

  return (
    <div className={clsx(
      'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium border',
      statusClassName,
      className
    )}>
      <Icon className={clsx('w-4 h-4', iconClassName)} />
      <span>{text}</span>
    </div>
  );
}

export function ConnectionIndicator({ connectionState, className }) {
  const getIndicatorColor = () => {
    switch (connectionState) {
      case CONNECTION_STATES.CONNECTED:
        return 'bg-green-500';
      case CONNECTION_STATES.CONNECTING:
      case CONNECTION_STATES.RECONNECTING:
        return 'bg-yellow-500 animate-pulse';
      case CONNECTION_STATES.ERROR:
        return 'bg-red-500';
      case CONNECTION_STATES.DISCONNECTED:
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className={clsx(
      'w-2 h-2 rounded-full',
      getIndicatorColor(),
      className
    )} />
  );
}

export default ConnectionStatus;
