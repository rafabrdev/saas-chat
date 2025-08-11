import React, { useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pt-br";
import clsx from "clsx";
import { 
  CheckIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PaperClipIcon,
  DocumentIcon
} from "@heroicons/react/24/outline";
import { CheckIcon as CheckSolidIcon } from "@heroicons/react/24/solid";
import { LoadingDots } from "./ui/LoadingSpinner";

// Configure dayjs
dayjs.extend(relativeTime);
dayjs.locale('pt-br');

// Message status enum
const MessageStatus = {
  PENDING: 'pending',
  SENDING: 'sending', 
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

export default function MessageBubble({ 
  message, 
  isOwn, 
  isPending = false,
  onRetry,
  showAvatar = true,
  isTyping = false,
  isGrouped = false,
  showTimestamp = true 
}) {
  const [imageLoading, setImageLoading] = useState(true);
  const [showFullTime, setShowFullTime] = useState(false);
  
  
  // Determine message status
  const getMessageStatus = () => {
    if (isPending || message.pending) return MessageStatus.PENDING;
    if (message.sending) return MessageStatus.SENDING;
    if (message.error || message.failed) return MessageStatus.FAILED;
    if (message.readAt) return MessageStatus.READ;
    if (message.deliveredAt) return MessageStatus.DELIVERED;
    if (message.sentAt || message.createdAt) return MessageStatus.SENT;
    return MessageStatus.PENDING;
  };

  const status = getMessageStatus();

  // Status indicator with animations
  const renderMessageStatus = () => {
    if (!isOwn) return null;

    const statusClasses = "flex items-center space-x-1 mt-1 transition-all duration-200";

    switch(status) {
      case MessageStatus.PENDING:
        return (
          <div className={clsx(statusClasses, "opacity-60")}>
            <ClockIcon className="w-3.5 h-3.5 text-gray-400 animate-pulse" />
            <span className="text-xs text-gray-400">Enviando...</span>
          </div>
        );
        
      case MessageStatus.SENDING:
        return (
          <div className={statusClasses}>
            <ArrowPathIcon className="w-3.5 h-3.5 text-gray-400 animate-spin" />
            <LoadingDots className="text-gray-400" size="small" />
          </div>
        );
        
      case MessageStatus.SENT:
        return (
          <div className={clsx(statusClasses, "animate-fade-in")} title="Enviada">
            <CheckIcon className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-400">
              {dayjs(message.sentAt || message.createdAt).format('HH:mm')}
            </span>
          </div>
        );
        
      case MessageStatus.DELIVERED:
        return (
          <div className={clsx(statusClasses, "animate-fade-in")} title="Entregue">
            <div className="flex -space-x-1">
              <CheckIcon className="w-3.5 h-3.5 text-gray-400" />
              <CheckIcon className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <span className="text-xs text-gray-400">
              {dayjs(message.deliveredAt).format('HH:mm')}
            </span>
          </div>
        );
        
      case MessageStatus.READ:
        return (
          <div className={clsx(statusClasses, "animate-fade-in")} title={`Lida às ${dayjs(message.readAt).format('HH:mm')}`}>
            <div className="flex -space-x-1">
              <CheckSolidIcon className="w-3.5 h-3.5 text-blue-500" />
              <CheckSolidIcon className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <span className="text-xs text-blue-500">
              {dayjs(message.readAt).format('HH:mm')}
            </span>
          </div>
        );
        
      case MessageStatus.FAILED:
        return (
          <div className={clsx(statusClasses, "animate-shake")}>
            <ExclamationTriangleIcon className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs text-red-500">Falha no envio</span>
            {onRetry && (
              <button
                onClick={() => onRetry(message)}
                className="text-xs text-red-600 underline hover:text-red-700 ml-1"
              >
                Tentar novamente
              </button>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  // Format timestamp with hover to show full date
  const formatTimestamp = () => {
    const date = message.createdAt || message.sentAt;
    if (!date) return '';
    
    const messageDate = dayjs(date);
    const now = dayjs();
    const diffHours = now.diff(messageDate, 'hours');
    
    if (diffHours < 1) {
      return messageDate.fromNow(); // "há alguns segundos"
    } else if (diffHours < 24) {
      return messageDate.format('HH:mm');
    } else if (diffHours < 48) {
      return `Ontem às ${messageDate.format('HH:mm')}`;
    } else {
      return messageDate.format('DD/MM às HH:mm');
    }
  };

  // Render attachments if any
  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-1">
        {message.attachments.map((attachment, idx) => (
          <div key={idx} className="flex items-center space-x-2 p-2 rounded bg-white/10">
            {attachment.type?.startsWith('image/') ? (
              <>
                {imageLoading && <LoadingDots size="small" />}
                <img 
                  src={attachment.url} 
                  alt={attachment.name}
                  className="max-w-xs rounded cursor-pointer hover:opacity-90 transition-opacity"
                  onLoad={() => setImageLoading(false)}
                  onClick={() => window.open(attachment.url, '_blank')}
                />
              </>
            ) : (
              <a 
                href={attachment.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-sm hover:underline"
              >
                <DocumentIcon className="w-4 h-4" />
                <span>{attachment.name || 'Anexo'}</span>
                <span className="text-xs opacity-70">
                  ({(attachment.size / 1024).toFixed(1)} KB)
                </span>
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Typing indicator
  if (isTyping) {
    return (
      <div className={clsx(
        "flex items-end gap-3 mb-4 animate-fade-in",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}>
        {!isOwn && showAvatar && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-semibold">
            {message.senderName?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <div className={clsx(
          "px-4 py-3 rounded-2xl max-w-[70%]",
          "bg-gray-100"
        )}>
          <LoadingDots size="medium" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={clsx(
        "flex items-end gap-3 transition-all duration-200",
        isGrouped ? "mb-1" : "mb-4",
        isOwn ? "flex-row-reverse" : "flex-row",
        status === MessageStatus.FAILED && "animate-shake-once"
      )}
      onMouseEnter={() => setShowFullTime(true)}
      onMouseLeave={() => setShowFullTime(false)}
    >
      {/* Avatar */}
      {!isOwn && showAvatar && !isGrouped && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
          {message.senderName?.[0]?.toUpperCase() || 'U'}
        </div>
      )}
      {!isOwn && showAvatar && isGrouped && (
        <div className="w-8" /> // Spacer for grouped messages
      )}

      {/* Message bubble */}
      <div className="flex flex-col max-w-[70%]">
        {/* Sender name for group chats */}
        {!isOwn && !isGrouped && message.senderName && (
          <span className="text-xs text-gray-500 mb-1 ml-2">
            {message.senderName}
          </span>
        )}
        
        <div
          className={clsx(
            "px-4 py-2.5 rounded-2xl transition-all duration-200",
            "shadow-sm hover:shadow-md",
            isOwn ? [
              status === MessageStatus.FAILED 
                ? "bg-red-50 border border-red-200" 
                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
              isGrouped ? "rounded-tr-md" : "rounded-tr-xl"
            ] : [
              "bg-white border border-gray-100 text-gray-800",
              isGrouped ? "rounded-tl-md" : "rounded-tl-xl"
            ],
            status === MessageStatus.PENDING && "opacity-70"
          )}
        >
          {/* Message content */}
          <div className="break-words whitespace-pre-wrap">
            {message.text || message.content}
          </div>
          
          {/* Attachments */}
          {renderAttachments()}
          
          {/* Timestamp - shown on hover or if showTimestamp is true */}
          {(showTimestamp || showFullTime) && !isGrouped && (
            <div className={clsx(
              "text-xs mt-1 transition-opacity duration-200",
              isOwn ? "text-blue-100" : "text-gray-400",
              showFullTime ? "opacity-100" : "opacity-0"
            )}>
              {formatTimestamp()}
            </div>
          )}
        </div>
        
        {/* Status indicator */}
        {renderMessageStatus()}
      </div>
    </div>
  );
}
