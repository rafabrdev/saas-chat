// Cache service para otimizar performance do frontend
class CacheService {
  constructor() {
    this.cache = new Map();
    this.expirationTimes = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutos
    
    // Limpar cache expirado a cada minuto
    setInterval(() => {
      this.cleanupExpired();
    }, 60000);
  }

  /**
   * Armazena um valor no cache
   * @param {string} key - Chave do cache
   * @param {any} value - Valor a ser armazenado
   * @param {number} ttl - Time to live em milissegundos
   */
  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, value);
    this.expirationTimes.set(key, Date.now() + ttl);
  }

  /**
   * Recupera um valor do cache
   * @param {string} key - Chave do cache
   * @returns {any|null} Valor armazenado ou null se não existir/expirado
   */
  get(key) {
    const expirationTime = this.expirationTimes.get(key);
    
    if (!expirationTime || Date.now() > expirationTime) {
      this.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  /**
   * Verifica se uma chave existe no cache e não expirou
   * @param {string} key - Chave do cache
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Remove uma chave do cache
   * @param {string} key - Chave do cache
   */
  delete(key) {
    this.cache.delete(key);
    this.expirationTimes.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear() {
    this.cache.clear();
    this.expirationTimes.clear();
  }

  /**
   * Remove itens expirados do cache
   */
  cleanupExpired() {
    const now = Date.now();
    
    for (const [key, expirationTime] of this.expirationTimes.entries()) {
      if (now > expirationTime) {
        this.delete(key);
      }
    }
  }

  /**
   * Obtém ou executa uma função e armazena o resultado
   * @param {string} key - Chave do cache
   * @param {Function} fn - Função a ser executada se não houver cache
   * @param {number} ttl - Time to live em milissegundos
   * @returns {Promise<any>}
   */
  async getOrSet(key, fn, ttl = this.defaultTTL) {
    const cached = this.get(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const result = await fn();
    this.set(key, result, ttl);
    
    return result;
  }

  /**
   * Invalida cache com base em padrão
   * @param {string|RegExp} pattern - Padrão para invalidar
   */
  invalidatePattern(pattern) {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
      }
    }
  }

  /**
   * Obtém estatísticas do cache
   * @returns {object}
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const expirationTime of this.expirationTimes.values()) {
      if (now > expirationTime) {
        expiredCount++;
      }
    }
    
    return {
      totalItems: this.cache.size,
      expiredItems: expiredCount,
      activeItems: this.cache.size - expiredCount,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estima o uso de memória do cache
   * @returns {number} Bytes aproximados
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    
    for (const [key, value] of this.cache.entries()) {
      totalSize += this.getObjectSize(key) + this.getObjectSize(value);
    }
    
    return totalSize;
  }

  /**
   * Estima o tamanho de um objeto em bytes
   * @param {any} obj - Objeto para medir
   * @returns {number} Tamanho estimado em bytes
   */
  getObjectSize(obj) {
    if (obj === null || obj === undefined) return 0;
    
    if (typeof obj === 'string') return obj.length * 2;
    if (typeof obj === 'number') return 8;
    if (typeof obj === 'boolean') return 4;
    
    if (typeof obj === 'object') {
      return JSON.stringify(obj).length * 2;
    }
    
    return 0;
  }
}

// Cache específico para mensagens
class MessageCache extends CacheService {
  constructor() {
    super();
    this.defaultTTL = 10 * 60 * 1000; // 10 minutos para mensagens
  }

  /**
   * Armazena mensagens de uma thread
   * @param {string} threadId - ID da thread
   * @param {Array} messages - Array de mensagens
   * @param {number} page - Página das mensagens
   */
  setThreadMessages(threadId, messages, page = 0) {
    const key = `thread:${threadId}:page:${page}`;
    this.set(key, {
      messages,
      timestamp: Date.now(),
      page
    });
  }

  /**
   * Recupera mensagens de uma thread
   * @param {string} threadId - ID da thread
   * @param {number} page - Página das mensagens
   * @returns {Array|null}
   */
  getThreadMessages(threadId, page = 0) {
    const key = `thread:${threadId}:page:${page}`;
    const cached = this.get(key);
    return cached ? cached.messages : null;
  }

  /**
   * Invalida cache de uma thread específica
   * @param {string} threadId - ID da thread
   */
  invalidateThread(threadId) {
    this.invalidatePattern(`thread:${threadId}:`);
  }

  /**
   * Adiciona nova mensagem ao cache
   * @param {string} threadId - ID da thread
   * @param {object} message - Nova mensagem
   */
  addMessageToThread(threadId, message) {
    // Adiciona à primeira página (mais recente)
    const key = `thread:${threadId}:page:0`;
    const cached = this.get(key);
    
    if (cached) {
      cached.messages.push(message);
      this.set(key, cached);
    }
  }

  /**
   * Atualiza uma mensagem específica
   * @param {string} threadId - ID da thread
   * @param {string} messageId - ID da mensagem
   * @param {object} updates - Atualizações da mensagem
   */
  updateMessage(threadId, messageId, updates) {
    const pattern = new RegExp(`thread:${threadId}:page:`);
    
    for (const [key, value] of this.cache.entries()) {
      if (pattern.test(key)) {
        const cached = value;
        const messageIndex = cached.messages.findIndex(m => m.id === messageId);
        
        if (messageIndex !== -1) {
          cached.messages[messageIndex] = {
            ...cached.messages[messageIndex],
            ...updates
          };
          this.set(key, cached);
        }
      }
    }
  }
}

// Cache para dados de usuário
class UserCache extends CacheService {
  constructor() {
    super();
    this.defaultTTL = 30 * 60 * 1000; // 30 minutos para dados de usuário
  }

  /**
   * Armazena dados do usuário
   * @param {string} userId - ID do usuário
   * @param {object} userData - Dados do usuário
   */
  setUser(userId, userData) {
    this.set(`user:${userId}`, userData);
  }

  /**
   * Recupera dados do usuário
   * @param {string} userId - ID do usuário
   * @returns {object|null}
   */
  getUser(userId) {
    return this.get(`user:${userId}`);
  }

  /**
   * Armazena lista de usuários online
   * @param {Array} users - Lista de usuários
   */
  setOnlineUsers(users) {
    this.set('users:online', users, 30000); // 30 segundos
  }

  /**
   * Recupera lista de usuários online
   * @returns {Array|null}
   */
  getOnlineUsers() {
    return this.get('users:online');
  }
}

// Instâncias singleton
const cacheService = new CacheService();
const messageCache = new MessageCache();
const userCache = new UserCache();

export {
  CacheService,
  MessageCache,
  UserCache,
  cacheService,
  messageCache,
  userCache
};

export default cacheService;