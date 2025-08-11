import React, { useState, useRef } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';

export default function Composer({ 
  onSend, 
  disabled = false, 
  placeholder = "Digite sua mensagem..." 
}) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef();

  const send = async () => {
    const trimmedText = text.trim();
    if (!trimmedText || disabled || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      await onSend(trimmedText);
      setText('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInputChange = (e) => {
    setText(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const canSend = text.trim() && !disabled && !isSubmitting;

  return (
    <div className="p-4 border-t bg-white">
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={clsx(
              'w-full resize-none rounded-2xl border px-4 py-3 pr-12',
              'focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300',
              'placeholder-gray-400 text-sm leading-5',
              'transition-all duration-200',
              disabled 
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-900'
            )}
            style={{ 
              minHeight: '44px',
              maxHeight: '120px',
            }}
          />
          
          {/* Character count (opcional) */}
          {text.length > 100 && (
            <div className="absolute bottom-1 left-3 text-xs text-gray-400">
              {text.length}/1000
            </div>
          )}
        </div>

        <button 
          onClick={send}
          disabled={!canSend}
          className={clsx(
            'p-3 rounded-full transition-all duration-200 flex items-center justify-center',
            'w-11 h-11 flex-shrink-0',
            canSend
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transform hover:scale-105'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
          title={disabled ? 'Conectando...' : 'Enviar mensagem (Enter)'}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <PaperAirplaneIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Dica de atalho */}
      <div className="text-xs text-gray-400 mt-2 text-center">
        Pressione Enter para enviar, Shift+Enter para nova linha
      </div>
    </div>
  );
}