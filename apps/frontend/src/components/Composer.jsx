import React, { useState, useRef, useEffect } from "react";
import { PaperAirplaneIcon, FaceSmileIcon, PaperClipIcon } from "@heroicons/react/24/solid";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import clsx from "clsx";
import LoadingSpinner from "./ui/LoadingSpinner";

export default function Composer({ onSend, onFileUpload, disabled = false, placeholder = "Digite sua mensagem..." }) {
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setText(prev => prev + emoji.native);
    setShowEmojiPicker(false);
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

  const canSend = text.trim() && !disabled && !isSending;

  return (
    <div className="p-4 border-t bg-white">
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        />

        {/* Attachment button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Anexar arquivo"
        >
          <PaperClipIcon className="w-5 h-5" />
        </button>

        {/* Message input container */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={disabled ? "Conectando..." : placeholder}
            disabled={disabled || isSending}
            rows={1}
            className={clsx(
              "w-full resize-none rounded-2xl border px-4 py-3 pr-12",
              "focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
              "transition-all duration-200",
              "placeholder:text-gray-400"
            )}
            style={{
              minHeight: '44px',
              maxHeight: '120px'
            }}
          />

          {/* Character counter for long messages */}
          {text.length > 200 && (
            <div className="absolute -bottom-5 right-0 text-xs text-gray-400">
              {text.length}/1000
            </div>
          )}
        </div>

        {/* Emoji button */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Adicionar emoji"
          >
            <FaceSmileIcon className="w-5 h-5" />
          </button>

          {/* Emoji picker popup */}
          {showEmojiPicker && (
            <div className="absolute bottom-12 right-0 z-50">
              <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                locale="pt"
              />
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={clsx(
            "p-3 rounded-full transition-all duration-200 flex items-center justify-center",
            canSend
              ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
          title={canSend ? "Enviar mensagem (Enter)" : "Digite uma mensagem"}
        >
          {isSending ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            <PaperAirplaneIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Typing indicator */}
      {isTyping && (
        <div className="text-xs text-gray-400 mt-2 px-4">
          Digitando...
        </div>
      )}

      {/* Quick actions */}
      <div className="flex items-center justify-between mt-3 px-4">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>Enter para enviar • Shift+Enter para nova linha</span>
        </div>
        
        {disabled && (
          <div className="flex items-center space-x-2 text-xs text-yellow-600">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span>Aguardando conexão...</span>
          </div>
        )}
      </div>
    </div>
  );
}