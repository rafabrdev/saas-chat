import React, { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';

const CustomEmojiPicker = ({ onEmojiClick, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full mb-2 z-50">
      <div className="relative">
        <EmojiPicker
          onEmojiClick={onEmojiClick}
          theme="dark"
          lazyLoadEmojis={true}
          previewConfig={{ showPreview: false }}
          width={350}
          height={400}
        />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default CustomEmojiPicker;