import { Injectable } from '@nestjs/common';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

@Injectable()
export class MarkdownService {
  private window = new JSDOM('').window;
  private purify = DOMPurify(this.window);

  constructor() {
    // Configurar marked para ser seguro
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
  }

  async parseMarkdown(content: string): Promise<string> {
    // Converter markdown para HTML
    const html = await marked(content);
    
    // Sanitizar HTML para segurança
    return this.purify.sanitize(html as string);
  }

  stripMarkdown(content: string): string {
    // Remover formatação markdown, manter apenas texto
    return content
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
      .replace(/\*([^*]+)\*/g, '$1')     // Italic
      .replace(/`([^`]+)`/g, '$1')       // Code
      .replace(/~~([^~]+)~~/g, '$1')     // Strikethrough
      .replace(/#+\s/g, '')              // Headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Links
  }
}