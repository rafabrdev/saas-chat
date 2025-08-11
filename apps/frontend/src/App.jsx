import React from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import { ToastProvider } from "./components/ui/Toast";

export default function App() {
  return (
    <ToastProvider>
            <div className="min-h-screen h-screen w-full">
        <div className="chat-container">
          <div className="hidden md:block md:w-64 lg:w-80 flex-shrink-0 h-full">
            <Sidebar />
          </div>
          <div className="flex-1 flex flex-col h-full">
            <ChatWindow />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}