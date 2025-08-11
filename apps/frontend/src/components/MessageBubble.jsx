import React from 'react';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { 
  UserIcon, 
  UserCircleIcon 
} from '@heroicons/react/24/outline';

export default function MessageBubble({ message, isOwn }) {
  const isAgent = message.senderType === 'agent' || message.sender === 'agent';
  const isUser = message.sender === 'user' || message.sender === 'me' || message.senderType === 'contact';

  // Determinar o tipo visual baseado no sender
  const actualIsOwn = isOwn || isUser;

  return (
    <div className={clsx(
      'flex gap-3 items-end max-w-[80%] mb-4',
      actualIsOwn ? 'ml-auto justify-end' : ''
    )}>
      {!actualIsOwn && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white">
          {isAgent ? (
            <UserCircleIcon className="w-5 h-5" />
          ) : (
            <UserIcon className="w-5 h-5" />
          )}
        </div>
      )}
      
      <div className="flex flex-col">
        {/* Nome do sender (apenas para mensagens de agentes) */}
        {!actualIsOwn && isAgent && (
          <div className="text-xs text-gray-500 mb-1 px-1">
            Agente
          </div>
        )}
        
        {/* Bubble da mensagem */}
        <div className={clsx(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm max-w-md',
          actualIsOwn 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
            : 'bg-white border text-gray-800'
        )}>
          {message.text || message.content}
        </div>
        
        {/* Timestamp */}
        <div className={clsx(
          'text-[11px] mt-1 text-gray-400',
          actualIsOwn ? 'text-right' : 'text-left'
        )}>
          {dayjs(message.createdAt).format('HH:mm')}
          
          {/* Status de entrega (apenas para mensagens próprias) */}
          {actualIsOwn && (
            <span className="ml-1 text-blue-400">✓</span>
          )}
        </div>
      </div>
    </div>
  );
}