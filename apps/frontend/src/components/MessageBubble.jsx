import React from "react";
import dayjs from "dayjs";
import clsx from "clsx";

export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={clsx("flex gap-3 items-end max-w-[80%] mb-3", isOwn ? "ml-auto justify-end" : "")}>
      {!isOwn && <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm">U</div>}
      <div>
        <div className={clsx(
          "px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm",
          isOwn ? "bg-gradient-to-r from-blue-500 to-blue-400 text-white" : "bg-slate-100 text-slate-800"
        )}>
          {message.text}
        </div>
        <div className="text-[11px] mt-1 text-slate-400 text-right">
          {dayjs(message.createdAt).format("HH:mm")}
        </div>
      </div>
    </div>
  );
}
