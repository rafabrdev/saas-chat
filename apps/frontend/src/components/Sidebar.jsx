import { ChatBubbleLeftRightIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
import React from "react";
import { useAuth } from "../hooks/useAuth.js";

export default function Sidebar() {
  const { logout } = useAuth();
  return (
    <aside className="bg-gradient-to-b from-white to-slate-50 p-4 border-r">
      <div className="flex items-center gap-3 mb-6 px-1">
        <div className="rounded-full bg-primary p-2 text-white">
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Chat Empresarial</h1>
          <p className="text-xs text-slate-500">Atendimento & suporte</p>
        </div>
      </div>

      <div className="space-y-2">
        <button className="w-full text-left px-3 py-2 rounded hover:bg-slate-100">Conversas</button>
        <button className="w-full text-left px-3 py-2 rounded hover:bg-slate-100">Clientes</button>
        <button className="w-full text-left px-3 py-2 rounded hover:bg-slate-100">Relatórios</button>
      </div>

      <div className="mt-auto pt-6">
        <div className="text-xs text-slate-500 mb-2">Configurações</div>
        <button className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 flex items-center gap-2">
          <Cog6ToothIcon className="w-4 h-4" /> Ajustes
        </button>
        <button 
          onClick={logout}
          className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 flex items-center gap-2 text-red-600"
        >
          <ArrowLeftOnRectangleIcon className="w-4 h-4" /> Sair
        </button>
      </div>
    </aside>
  );
}
