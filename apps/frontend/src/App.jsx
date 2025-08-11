import React from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="chat-container">
        <Sidebar />
        <ChatWindow />
      </div>
    </div>
  );
}
