import { useEffect, useState, useCallback, useRef } from 'react';
import socket from '../lib/socket';

export const useSocket = () => {
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [currentThread, setCurrentThread] = useState(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    // Conectar socket
    socket.connect();
    setConnectionStatus('connecting');

    // Listeners
    const onConnect = () => {
      console.log('✅ Socket connected');
      setConnectionStatus('connected');
      setError(null);
      isConnectedRef.current = true;
    };

    const onDisconnect = () => {
      console.log('❌ Socket disconnected');
      setConnectionStatus('disconnected');
      isConnectedRef.current = false;
    };

    const onError = (errorData) => {
      console.error('Socket error:', errorData);
      setError(errorData.message || 'Erro de conexão');
    };

    const onConnected = (data) => {
      console.log('Connected to company:', data);
      setCurrentThread(data.threadId);
    };

    const onHistory = (history) => {
      console.log('Received history:', history?.length || 0, 'messages');
      setMessages(history || []);
    };

    const onMessage = (message) => {
      console.log('New message received:', message);
      setMessages(prev => {
        // Evitar duplicação
        const exists = prev.find(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    };

    const onReceiveMessage = (message) => {
      console.log('Received message:', message);
      setMessages(prev => {
        // Evitar duplicação
        const exists = prev.find(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    };

    // Registrar listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);
    socket.on('connected', onConnected);
    socket.on('history', onHistory);
    socket.on('message', onMessage);
    socket.on('receiveMessage', onReceiveMessage);

    // Cleanup
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('error', onError);
      socket.off('connected', onConnected);
      socket.off('history', onHistory);
      socket.off('message', onMessage);
      socket.off('receiveMessage', onReceiveMessage);
      socket.disconnect();
      isConnectedRef.current = false;
    };
  }, []);

  const sendMessage = useCallback((text) => {
    if (!isConnectedRef.current) {
      setError('Não conectado ao servidor');
      return false;
    }

    if (!text.trim()) {
      return false;
    }

    try {
      // Usar o evento 'message' que o backend espera
      socket.emit('message', { text: text.trim() });
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Erro ao enviar mensagem');
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    connectionStatus,
    error,
    currentThread,
    sendMessage,
    clearError,
    isConnected: connectionStatus === 'connected',
  };
};