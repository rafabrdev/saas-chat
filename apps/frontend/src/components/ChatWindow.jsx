import React, { useEffect, useRef, useState } from "react";
import socket from "../lib/socket";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const listRef = useRef();

  useEffect(() => {
    // conecta so quando componente montar
    socket.connect();

    socket.on("history", (history) => {
      setMessages(history || []);
      // scroll to bottom
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 100);
    });

    socket.on("message", (msg) => {
      setMessages((p) => [...p, msg]);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 50);
    });

    return () => {
      socket.off("history");
      socket.off("message");
      socket.disconnect();
    };
  }, []);

  const handleSend = (text) => {
    // local echo
    const local = { id: `local-${Date.now()}`, text, createdAt: new Date().toISOString(), sender: "me" };
    setMessages((p) => [...p, local]);
    socket.emit("message", { text }); // seu backend deve aceitar esse formato
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-4 border-b flex items-center justify-between bg-white">
        <div>
          <div className="text-sm text-slate-500">Atendimento</div>
          <div className="font-semibold">Suporte — BR Sistemas</div>
        </div>
        <div className="text-xs text-slate-400">Online</div>
      </header>

      <main ref={listRef} className="p-6 overflow-y-auto flex-1 bg-[#f7f8fb]">
        <div className="max-w-3xl mx-auto">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} isOwn={m.sender === "me" || m.sender === "agent-me"} />
          ))}
        </div>
      </main>

      <Composer onSend={handleSend} />
    </div>
  );
}
