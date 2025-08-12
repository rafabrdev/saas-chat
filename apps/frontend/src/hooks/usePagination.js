import React, { useState, useCallback, useMemo } from 'react';

export function usePagination(options = {}) {
  const {
    initialPage = 0,
    initialLimit = 20,
    totalCount = 0
  } = options;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(totalCount);
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = useMemo(() => {
    return Math.ceil(total / limit);
  }, [total, limit]);

  const hasNextPage = useMemo(() => {
    return page < totalPages - 1;
  }, [page, totalPages]);

  const hasPreviousPage = useMemo(() => {
    return page > 0;
  }, [page]);

  const offset = useMemo(() => {
    return page * limit;
  }, [page, limit]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  const goToPage = useCallback((newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setTotal(0);
  }, [initialPage]);

  return {
    // Current state
    page,
    limit,
    total,
    offset,
    isLoading,
    
    // Computed values
    totalPages,
    hasNextPage,
    hasPreviousPage,
    
    // Actions
    setPage,
    setLimit,
    setTotal,
    setIsLoading,
    nextPage,
    previousPage,
    goToPage,
    reset
  };
}

// Hook específico para mensagens com carregamento infinito
export function useInfiniteMessages(fetchFunction, options = {}) {
  const {
    limit = 50,
    initialLoad = true
  } = options;

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);

  const loadMessages = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      setError(null);

      const response = await fetchFunction({
        page: pageNum,
        limit,
        offset: pageNum * limit
      });

      const newMessages = response.messages || [];
      const hasMoreMessages = response.hasMore ?? newMessages.length === limit;

      if (append && pageNum > 0) {
        // Para scroll infinito, adiciona no início (mensagens mais antigas)
        setMessages(prev => [...newMessages, ...prev]);
      } else {
        // Para carregamento inicial
        setMessages(newMessages);
      }

      setHasMore(hasMoreMessages);
      setPage(pageNum);

      return { messages: newMessages, hasMore: hasMoreMessages };
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [fetchFunction, limit]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading) return;
    return loadMessages(page + 1, true);
  }, [hasMore, isLoadingMore, isLoading, loadMessages, page]);

  const refresh = useCallback(() => {
    setPage(0);
    setHasMore(true);
    return loadMessages(0, false);
  }, [loadMessages]);

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((messageId, updates) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  const removeMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // Auto-load inicial
  React.useEffect(() => {
    if (initialLoad) {
      loadMessages(0, false);
    }
  }, [loadMessages, initialLoad]);

  return {
    // Data
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    page,

    // Actions
    loadMessages,
    loadMore,
    refresh,
    addMessage,
    updateMessage,
    removeMessage
  };
}