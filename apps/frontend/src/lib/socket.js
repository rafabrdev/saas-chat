import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const socket = io(API, { autoConnect: false });

export default socket;
