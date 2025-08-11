// apps/frontend/src/components/ChatWindow.jsx
import React, { useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import MessageBubble from './MessageBubble';
import Composer from './Composer';
import ChatHeader from './ChatHeader';
import ConnectionStatus from './ConnectionStatus';
import LoadingSpinner from './LoadingSpinner';

export default function ChatWindow() {
  const { 
    messages, 
    connectionStatus, 
    error, 
    connectedUsers,
    typingUsers,
    sendMessage, 
    startTyping,
    stopTyping,
    clearError, 
    retryConnection,
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ChatHeader 
        connectionStatus={connectionStatus}
        onlineUsersCount={connectedUsers.length}
      />

      {/* Status de erro */}
      {error && (
        <div className="px-6 py-2">
          <ConnectionStatus 
            status={connectionStatus} 
            error={error} 
            onRetry={retryConnection}
          />
        </div>
      )}

      {/* Messages Area */}
      <main 
        ref={listRef} 
        className="p-6 overflow-y-auto flex-1 bg-gradient-to-b from-gray-50 to-gray-100"
      >
        <div className="max-w-4xl mx-auto">
          {/* Loading state */}
          {connectionStatus === 'connecting' && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <p className="text-gray-500 mt-4">Carregando conversa...</p>
            </div>
          )}

          {/* Empty state */}
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

          {/* Messages */}
          {messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              isOwn={message.sender === 'user' || message.sender === 'me'} 
            />
          ))}

          {/* Typing indicators */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-3 mb-4 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <div className="w-4 h-4 text-gray-500">...</div>
              </div>
              <div className="px-4 py-2 bg-gray-100 rounded-2xl">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">
                    {typingUsers.map(u => u.userName).join(', ')} está digitando
                  </span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" />
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-100" />
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-200" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Composer */}
      <Composer 
        onSend={handleSend} 
        onStartTyping={startTyping}
        onStopTyping={stopTyping}
        disabled={!isConnected}
        placeholder={isConnected ? "Digite sua mensagem..." : "Conectando..."}
      />
    </div>
  );
}