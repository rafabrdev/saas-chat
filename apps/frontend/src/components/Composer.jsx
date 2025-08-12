import React, { useState, useRef, useEffect } from "react";
import { PaperAirplaneIcon, FaceSmileIcon, PaperClipIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import LoadingSpinner from "./ui/LoadingSpinner";
import CustomEmojiPicker from './ui/EmojiPicker';
import MarkdownPreview from './ui/MarkdownPreview';

export default function Composer({ onSend, onFileUpload, disabled = false, placeholder = "Digite sua mensagem... (Suporta Markdown)" }) {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  // Handle typing indicators
  useEffect(() => {
    if (text.trim() && !isTyping) {
      setIsTyping(true);
      // TODO: Emit typing event to socket
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        // TODO: Emit stop typing event to socket
      }
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [text, isTyping]);

  const handleSend = async () => {
    const messageText = text.trim();
    if (!messageText || disabled || isSending) return;

    setIsSending(true);
    setText("");
    
    try {
      await onSend(messageText);
    } catch (error) {
      // Restore text on error
      console.error('Failed to send message:', error);
      setText(messageText);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="composer bg-gray-800 p-4 border-t border-gray-700">
      {/* Preview de Markdown */}
      {showPreview && text.trim() && (
        <div className="mb-3 p-3 bg-gray-900 rounded-lg border border-gray-600">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Preview:</span>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-white text-sm"
            >
              Ocultar
            </button>
          </div>
          <MarkdownPreview content={text} />
        </div>
      )}

      <div className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (!isTyping) setIsTyping(true);
            }}
            onKeyDown={handleKeyPress}
            placeholder={disabled ? "Conectando..." : placeholder}
            className="w-full resize-none bg-gray-700 text-white rounded-lg px-4 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            disabled={disabled || isSending}
            style={{
              minHeight: '52px',
              maxHeight: '150px',
            }}
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {/* Botão Emoji */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className="p-2 text-gray-400 hover:text-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Adicionar emoji"
            >
              😊
            </button>

            {/* Botão Preview */}
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              disabled={disabled || !text.trim()}
              className={clsx(
                "p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                showPreview ? "text-blue-400" : "text-gray-400 hover:text-blue-400"
              )}
              title="Preview Markdown"
            >
              👁
            </button>

            {/* Botão Anexo */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-2 text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Anexar arquivo"
            >
              <PaperClipIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Emoji Picker */}
          <CustomEmojiPicker
            isOpen={showEmojiPicker}
            onEmojiClick={(emoji) => {
              const textarea = textareaRef.current;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const newText = text.substring(0, start) + emoji.emoji + text.substring(end);
              setText(newText);
              setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + emoji.emoji.length, start + emoji.emoji.length);
              }, 0);
              setShowEmojiPicker(false);
            }}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled || isSending}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors flex items-center justify-center"
          title="Enviar mensagem (Enter)"
        >
          {isSending ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            <PaperAirplaneIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
      />

      {/* Dica de Markdown */}
      <div className="mt-2 text-xs text-gray-500 flex items-center space-x-4">
        <span>**negrito**</span>
        <span>*itálico*</span>
        <span>`código`</span>
        <span>[link](url)</span>
      </div>

      {/* Typing indicator */}
      {isTyping && (
        <div className="text-xs text-gray-400 mt-2">
          Digitando...
        </div>
      )}
    </div>
  );
}