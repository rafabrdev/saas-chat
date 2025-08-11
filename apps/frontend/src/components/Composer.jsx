import React, { useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

export default function Composer({ onSend }) {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="p-4 border-t bg-white flex items-center gap-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        placeholder="Pergunte alguma coisa..."
        className="flex-1 rounded-full border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      <button onClick={send} className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white">
        <PaperAirplaneIcon className="w-5 h-5 rotate-45" />
      </button>
    </div>
  );
}
