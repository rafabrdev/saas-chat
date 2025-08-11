import React, { useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import MessageBubble from './MessageBubble';
import Composer from './Composer';
import ConnectionStatus from './ConnectionStatus';
import LoadingSpinner from './LoadingSpinner';

export default function ChatWindow() {
  const { 
    messages, 
    connectionStatus, 
    error, 
    sendMessage, 
    clearError, 
    isConnected 
  } = useSocket();
  
  const listRef = useRef();

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      const scrollContainer = listRef.current;
      const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
      
      if (isNearBottom) {
        setTimeout(() => {
          scrollContainer.scrollTo({ 
            top: scrollContainer.scrollHeight, 
            behavior: 'smooth' 
          });
        }, 100);
      }
    }
  }, [messages]);

  const handleSend = (text) => {
    const success = sendMessage(text);
    if (!success && error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleRetryConnection = () => {
    clearError();
    // O socket tentará reconectar automaticamente
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-6 py-4 border-b flex items-center justify-between bg-white">
        <div>
          <div className="text-sm text-slate-500">Atendimento</div>
          <div className="font-semibold">Suporte — BR Sistemas</div>
        </div>
        
        <div className="flex items-center gap-3">
          <ConnectionStatus 
            status={connectionStatus} 
            error={error} 
            onRetry={handleRetryConnection}
          />
          <div className={`text-xs px-2 py-1 rounded-full ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {isConnected ? 'Online' : 'Offline'}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main 
        ref={listRef} 
        className="p-6 overflow-y-auto flex-1 bg-gradient-to-b from-gray-50 to-gray-100"
      >
        <div className="max-w-4xl mx-auto">
          {connectionStatus === 'connecting' && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <p className="text-gray-500 mt-4">Carregando conversa...</p>
            </div>
          )}

          {messages.length === 0 && connectionStatus === 'connected' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bem-vindo ao atendimento!</h3>
              <p className="text-gray-500 text-center">
                Envie uma mensagem para iniciar a conversa.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              isOwn={message.sender === 'user' || message.sender === 'me'} 
            />
          ))}
        </div>
      </main>

      {/* Composer */}
      <Composer 
        onSend={handleSend} 
        disabled={!isConnected}
        placeholder={isConnected ? "Digite sua mensagem..." : "Conectando..."}
      />
    </div>
  );
}