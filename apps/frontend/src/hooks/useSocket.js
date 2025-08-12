import { useEffect, useRef, useState, useCallback } from 'react';
import socket from '../lib/socket';
import { useToast } from '../components/ui/Toast';

const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

export function useSocket(options = {}) {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
    showConnectionStatus = true
  } = options;

  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onlineStatus !== false);
  
  const toast = useToast();
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (connectionState === CONNECTION_STATES.DISCONNECTED) {
        connect();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionState(CONNECTION_STATES.DISCONNECTED);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connectionState]); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = useCallback(() => {
    if (!isOnline) {
      if (showConnectionStatus) {
        toast.warning('Sem conexão com a internet');
      }
      return;
    }

    setConnectionState(CONNECTION_STATES.CONNECTING);
    socket.connect();
  }, [isOnline, showConnectionStatus, toast]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    setConnectionState(CONNECTION_STATES.DISCONNECTED);
    socket.disconnect();
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= reconnectAttempts || !isOnline) {
      setConnectionState(CONNECTION_STATES.ERROR);
      if (showConnectionStatus) {
        toast.error('Não foi possível conectar. Verifique sua conexão.');
      }
      return;
    }

    reconnectAttemptsRef.current += 1;
    setReconnectCount(reconnectAttemptsRef.current);
    setConnectionState(CONNECTION_STATES.RECONNECTING);

    const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1); // Exponential backoff
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (showConnectionStatus) {
        toast.info(`Tentativa ${reconnectAttemptsRef.current} de ${reconnectAttempts}...`);
      }
      connect();
    }, delay);
  }, [reconnectAttempts, isOnline, showConnectionStatus, reconnectDelay, connect, toast]);

  // Socket event listeners
  useEffect(() => {
    const handleConnect = () => {
      reconnectAttemptsRef.current = 0;
      setReconnectCount(0);
      setConnectionState(CONNECTION_STATES.CONNECTED);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (showConnectionStatus) {
        toast.success('Conectado com sucesso!');
      }
    };

    const handleDisconnect = (reason) => {
      setConnectionState(CONNECTION_STATES.DISCONNECTED);
      
      if (showConnectionStatus) {
        toast.warning('Conexão perdida');
      }

      // Auto-reconnect unless manually disconnected
      if (reason !== 'io client disconnect' && isOnline) {
        scheduleReconnect();
      }
    };

    const handleConnectError = (error) => {
      console.error('Socket connection error:', error);
      setConnectionState(CONNECTION_STATES.ERROR);
      
      if (isOnline) {
        scheduleReconnect();
      }
    };

    const handleReconnect = () => {
      setConnectionState(CONNECTION_STATES.CONNECTED);
      reconnectAttemptsRef.current = 0;
      setReconnectCount(0);
      
      if (showConnectionStatus) {
        toast.success('Reconectado!');
      }
    };

    const handleReconnectAttempt = () => {
      setConnectionState(CONNECTION_STATES.RECONNECTING);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
    };
  }, [isOnline, scheduleReconnect, showConnectionStatus, toast]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && isOnline) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [autoConnect, isOnline, connect]);

  // Emit with error handling
  const emit = useCallback((event, data, callback) => {
    if (connectionState !== CONNECTION_STATES.CONNECTED) {
      const error = new Error('Socket não conectado');
      if (callback) callback(error);
      return Promise.reject(error);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout na operação'));
      }, 10000);

      socket.emit(event, data, (response) => {
        clearTimeout(timeout);
        if (response && response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
        if (callback) callback(null, response);
      });
    });
  }, [connectionState]);

  return {
    socket,
    connectionState,
    isConnected: connectionState === CONNECTION_STATES.CONNECTED,
    isConnecting: connectionState === CONNECTION_STATES.CONNECTING,
    isReconnecting: connectionState === CONNECTION_STATES.RECONNECTING,
    reconnectCount,
    connect,
    disconnect,
    emit
  };
}

export { CONNECTION_STATES };