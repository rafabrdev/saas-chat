import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Função para obter o token do localStorage
const getAuthToken = () => {
  // O AuthContext salva como 'chat_token'
  const token = localStorage.getItem('chat_token') || localStorage.getItem('token');
  return token;
};

// Configurar socket com autenticação
const socket = io(API, { 
  autoConnect: false,
  auth: {
    token: getAuthToken()
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Atualizar token quando reconectar
socket.on('connect', () => {
  console.log('Socket conectado, atualizando token...');
  const token = getAuthToken();
  if (token) {
    socket.auth.token = token;
    console.log('Token atualizado no socket');
  } else {
    console.warn('Nenhum token encontrado para autenticação do socket');
  }
});

// Log de eventos para debug
socket.on('authenticated', (data) => {
  console.log('Socket autenticado:', data);
});

socket.on('auth_error', (error) => {
  console.error('Erro de autenticação no socket:', error);
});

socket.on('connect_error', (error) => {
  console.error('Erro de conexão:', error.message);
});

export default socket;
