import React, { useEffect, useRef, useState, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";
import ConnectionStatus from "./ui/ConnectionStatus";
import { LoadingOverlay, LoadingSkeleton } from "./ui/LoadingSpinner";
import { useSocket } from "../hooks/useSocket";
import { useLoading } from "../hooks/useLoading";
import { useToast } from "./ui/Toast";

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  
  const listRef = useRef();
  const lastMessageRef = useRef();
  const { isLoading: isSendingMessage } = useLoading();
  const toast = useToast();
  
  const { 
    socket, 
    connectionState, 
    isConnected, 
    emit 
  } = useSocket({
    autoConnect: true,
    showConnectionStatus: false // gerenciamos manualmente
  });

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (listRef.current) {
      listRef.current.scrollTo({ 
        top: listRef.current.scrollHeight, 
        behavior 
      });
    }
  }, []);

  // Load message history
  const loadHistory = useCallback(async (pageNum = 0) => {
    try {
      setIsLoadingHistory(true);
      const response = await emit('getHistory', { page: pageNum, limit: 50 });
      
      if (response?.messages) {
        if (pageNum === 0) {
          setMessages(response.messages);
          setTimeout(() => scrollToBottom("auto"), 100);
        } else {
          setMessages(prev => [...response.messages, ...prev]);
        }
        
        setHasMore(response.hasMore || false);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Erro ao carregar histórico de mensagens');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [emit, scrollToBottom, toast]);

  // Socket event handlers
  useEffect(() => {
    if (!isConnected) return;

    // Handler para histórico inicial enviado pelo servidor
    const handleHistory = (historyMessages) => {
      console.log('Histórico recebido:', historyMessages);
      if (Array.isArray(historyMessages)) {
        setMessages(historyMessages);
        setIsLoadingHistory(false);
        setTimeout(() => scrollToBottom("auto"), 100);
      }
    };

    // Handler para quando autenticação é confirmada
    const handleAuthenticated = (data) => {
      console.log('Autenticação confirmada:', data);
      // Podemos usar o threadId aqui se necessário
    };

    const handleMessage = (msg) => {
      setMessages(prev => {
        // Evitar duplicatas
        const exists = prev.some(m => m.id === msg.id);
        if (exists) return prev;
        
        const newMessages = [...prev, msg];
        setTimeout(() => scrollToBottom(), 50);
        return newMessages;
      });
    };

    const handleMessageError = (error) => {
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
    };

    const handleTyping = (data) => {
      // TODO: Implementar indicador de digitação
      console.log('User typing:', data);
    };

    // Registrar listeners
    socket.on("history", handleHistory);
    socket.on("authenticated", handleAuthenticated);
    socket.on("message", handleMessage);
    socket.on("messageError", handleMessageError);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("history", handleHistory);
      socket.off("authenticated", handleAuthenticated);
      socket.off("message", handleMessage);
      socket.off("messageError", handleMessageError);
      socket.off("typing", handleTyping);
    };
  }, [isConnected, socket, loadHistory, scrollToBottom, toast]);

  // Send message with error handling
  const handleSend = useCallback(async (text) => {
    if (!isConnected) {
      toast.error('Você está desconectado. Aguardando reconexão...');
      return;
    }

    if (!text.trim()) return;

    // Optimistic update
    const optimisticMessage = { 
      id: `temp-${Date.now()}`, 
      text: text.trim(), 
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      sender: "me",
      senderName: "Você",
      pending: true,
      sending: true
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      const response = await emit("sendMessage", { 
        text: text.trim(),
        threadId: currentThreadId // Usa o threadId atual se existir
      });

      // Salva o threadId retornado pelo backend
      if (response?.threadId && !currentThreadId) {
        setCurrentThreadId(response.threadId);
      }

      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id 
            ? { 
                ...response.message, 
                pending: false,
                sending: false,
                sentAt: response.message.createdAt,
                deliveredAt: new Date().toISOString()
              }
            : msg
        )
      );

      // Simulate read receipt after 2 seconds
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === response.message.id
              ? { ...msg, readAt: new Date().toISOString() }
              : msg
          )
        );
      }, 2000);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Mark message as failed instead of removing
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id
            ? { ...msg, pending: false, sending: false, error: true, failed: true }
            : msg
        )
      );
      toast.error('Falha ao enviar mensagem');
    }
  }, [isConnected, emit, scrollToBottom, toast, currentThreadId]);

  // Retry failed message
  const handleRetry = useCallback(async (message) => {
    // Mark as sending again
    setMessages(prev => 
      prev.map(msg => 
        msg.id === message.id
          ? { ...msg, error: false, failed: false, pending: true, sending: true }
          : msg
      )
    );

    try {
      const response = await emit("sendMessage", { 
        text: message.text,
        threadId: currentThreadId // Usa o threadId atual se existir
      });

      // Salva o threadId retornado pelo backend
      if (response?.threadId && !currentThreadId) {
        setCurrentThreadId(response.threadId);
      }

      // Replace with successful message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id
            ? { 
                ...response.message, 
                pending: false,
                sending: false,
                error: false,
                failed: false,
                sentAt: response.message.createdAt,
                deliveredAt: new Date().toISOString()
              }
            : msg
        )
      );

      toast.success('Mensagem reenviada com sucesso');
    } catch (error) {
      console.error('Error retrying message:', error);
      // Mark as failed again
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id
            ? { ...msg, pending: false, sending: false, error: true, failed: true }
            : msg
        )
      );
      toast.error('Falha ao reenviar mensagem');
    }
  }, [emit, toast, currentThreadId]);

  // Load more messages (pagination)
  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoadingHistory) return;
    loadHistory(page + 1);
  }, [hasMore, isLoadingHistory, loadHistory, page]);

  // Intersection Observer for auto-scroll on new messages
  useEffect(() => {
    if (!lastMessageRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          scrollToBottom();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(lastMessageRef.current);
    return () => observer.disconnect();
  }, [messages.length, scrollToBottom]);

  const renderMessages = () => {
    if (isLoadingHistory && messages.length === 0) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 items-end max-w-[80%]">
              <LoadingSkeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <LoadingSkeleton className="h-4 rounded-lg mb-2" />
                <LoadingSkeleton className="h-3 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <>
        {hasMore && messages.length > 0 && (
          <div className="text-center py-4">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingHistory}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {isLoadingHistory ? 'Carregando...' : 'Carregar mensagens anteriores'}
            </button>
          </div>
        )}
        
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
          
          // Check if messages should be grouped
          const isGrouped = prevMessage && 
            prevMessage.sender === message.sender &&
            // Messages within 1 minute of each other
            new Date(message.createdAt) - new Date(prevMessage.createdAt) < 60000;
          
          const isOwn = message.sender === "me" || message.sender === "agent-me";
          
          return (
            <div
              key={message.id}
              ref={index === messages.length - 1 ? lastMessageRef : null}
            >
              <MessageBubble 
                message={message} 
                isOwn={isOwn}
                isPending={message.pending}
                isGrouped={isGrouped}
                onRetry={message.failed ? handleRetry : undefined}
                showAvatar={!isOwn}
                showTimestamp={!nextMessage || nextMessage.sender !== message.sender ||
                  new Date(nextMessage.createdAt) - new Date(message.createdAt) >= 60000}
              />
            </div>
          );
        })}
      </>
    );
  };

  const handleFileUpload = useCallback(async ({ file }) => {
    if (!isConnected) {
      toast.error('Você está desconectado. Aguardando reconexão...');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      type: 'file',
      fileName: file.name,
      fileSize: file.size,
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      sender: "me",
      senderName: "Você",
      pending: true,
      sending: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      const response = await emit("uploadFile", { file: formData });
      setMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticMessage.id
            ? {
                ...response.message,
                pending: false,
                sending: false,
                sentAt: response.message.createdAt,
                deliveredAt: new Date().toISOString()
              }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to upload file:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticMessage.id
            ? { ...msg, pending: false, sending: false, error: true, failed: true }
            : msg
        )
      );
      toast.error('Falha ao enviar arquivo');
    }
  }, [isConnected, emit, scrollToBottom, toast]);

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 sm:px-6 py-4 border-b flex items-center justify-between bg-white">
        <div className="flex items-center space-x-4">
          <button className="md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <div className="text-sm text-slate-500">Atendimento</div>
            <div className="font-semibold">Suporte — BR Sistemas</div>
          </div>
        </div>
        <ConnectionStatus 
          connectionState={connectionState} 
          compact={true}
        />
      </header>

      <main 
        ref={listRef} 
        className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#f7f8fb] relative"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {renderMessages()}
        </div>
      </main>

      <LoadingOverlay 
        isLoading={isSendingMessage}
        message="Enviando mensagem..."
      >
        <Composer 
          onSend={handleSend} 
          onFileUpload={handleFileUpload}
          disabled={!isConnected || isSendingMessage} 
        />
      </LoadingOverlay>
    </div>
  );
}