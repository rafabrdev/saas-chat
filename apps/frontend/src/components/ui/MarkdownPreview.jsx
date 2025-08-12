import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownPreview = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Personalizar componentes
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-blue-400">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
          code: ({ children, inline }) => (
            inline 
              ? <code className="bg-gray-800 text-green-400 px-1 rounded text-sm">{children}</code>
              : <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto"><code className="text-green-400">{children}</code></pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 text-gray-300 italic">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;