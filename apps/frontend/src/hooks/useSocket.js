// apps/frontend/src/hooks/useSocket.js
import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

export const useSocket = () => {
  const { token, isAuthenticated, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [currentThread, setCurrentThread] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const isConnectedRef = useRef(false);

  // Conectar/Desconectar baseado na autenticação
  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token]);

  const connectSocket = () => {
    if (socket?.connected) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    const newSocket = io(API_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });

    setSocket(newSocket);
    setupSocketListeners(newSocket);
    
    newSocket.connect();
    setConnectionStatus('connecting');
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setConnectionStatus('disconnected');
    setMessages([]);
    setCurrentThread(null);
    setConnectedUsers([]);
    setTypingUsers([]);
    isConnectedRef.current = false;
  };

  const setupSocketListeners = (socketInstance) => {
    // Conexão estabelecida
    socketInstance.on('connect', () => {
      console.log('✅ Socket connected successfully');
      setConnectionStatus('connected');
      setError(null);
      isConnectedRef.current = true;
    });

    // Desconexão
    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnectionStatus('disconnected');
      isConnectedRef.current = false;
      
      // Se foi desconectado por erro de auth, fazer logout
      if (reason === 'io server disconnect') {
        console.warn('Disconnected by server, possibly due to auth error');
      }
    });

    // Erro de conexão
    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus('disconnected');
      setError('Erro de conexão com o servidor');
      isConnectedRef.current = false;
    });

    // Erro de autenticação
    socketInstance.on('auth_error', (data) => {
      console.error('Authentication error:', data);
      setError(data.message || 'Erro de autenticação');
      setConnectionStatus('disconnected');
      isConnectedRef.current = false;
      
      // Fazer logout se token inválido
      logout();
    });

    // Autenticação bem-sucedida
    socketInstance.on('authenticated', (data) => {
      console.log('🔐 Authenticated successfully:', data);
      setCurrentThread(data.threadId);
      setError(null);
    });

    // Histórico de mensagens
    socketInstance.on('history', (history) => {
      console.log('📜 Received message history:', history?.length || 0, 'messages');
      setMessages(history || []);
    });

    // Nova mensagem
    socketInstance.on('message', (message) => {
      console.log('💬 New message received:', message);
      setMessages(prev => {
        // Evitar duplicação
        const exists = prev.find(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    // Usuário entrou
    socketInstance.on('user_joined', (data) => {
      console.log('👋 User joined:', data);
      setConnectedUsers(prev => {
        const exists = prev.find(u => u.userId === data.userId);
        if (exists) return prev;
        return [...prev, data];
      });
    });

    // Usuário saiu
    socketInstance.on('user_left', (data) => {
      console.log('👋 User left:', data);
      setConnectedUsers(prev => prev.filter(u => u.userId !== data.userId));
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    // Usuário digitando
    socketInstance.on('user_typing', (data) => {
      setTypingUsers(prev => {
        const exists = prev.find(u => u.userId === data.userId);
        if (exists) return prev;
        return [...prev, data];
      });

      // Auto-remover após 3 segundos
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
      }, 3000);
    });

    // Usuário parou de digitar
    socketInstance.on('user_stopped_typing', (data) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    // Erro geral
    socketInstance.on('error', (data) => {
      console.error('Socket error:', data);
      setError(data.message || 'Erro do servidor');
    });
  };

  const sendMessage = useCallback((text) => {
    if (!isConnectedRef.current || !socket) {
      setError('Não conectado ao servidor');
      return false;
    }

    if (!text.trim()) {
      return false;
    }

    try {
      socket.emit('message', { text: text.trim() });
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Erro ao enviar mensagem');
      return false;
    }
  }, [socket]);

  const startTyping = useCallback(() => {
    if (socket && isConnectedRef.current) {
      socket.emit('typing');
    }
  }, [socket]);

  const stopTyping = useCallback(() => {
    if (socket && isConnectedRef.current) {
      socket.emit('stop_typing');
    }
  }, [socket]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retryConnection = useCallback(() => {
    if (isAuthenticated && token) {
      disconnectSocket();
      setTimeout(() => {
        connectSocket();
      }, 1000);
    }
  }, [isAuthenticated, token]);

  return {
    messages,
    connectionStatus,
    error,
    currentThread,
    connectedUsers,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    clearError,
    retryConnection,
    isConnected: connectionStatus === 'connected',
  };
};