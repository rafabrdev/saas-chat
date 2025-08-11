import { io } from "socket.io-client";

// Troque pelo endereço do seu backend
const socket = io("http://localhost:3001", {
  transports: ["websocket"],
});

export default socket;
