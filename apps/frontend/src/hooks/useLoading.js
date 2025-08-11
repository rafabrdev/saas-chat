import { useState, useCallback } from 'react';

export function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = useCallback((error) => {
    setError(error);
    setIsLoading(false);
  }, []);

  const executeWithLoading = useCallback(async (asyncFunction) => {
    startLoading();
    try {
      const result = await asyncFunction();
      stopLoading();
      return result;
    } catch (err) {
      setLoadingError(err);
      throw err;
    }
  }, [startLoading, stopLoading, setLoadingError]);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError: setLoadingError,
    executeWithLoading
  };
}

// Hook específico para múltiplos estados de loading
export function useMultiLoading() {
  const [loadingStates, setLoadingStates] = useState({});
  const [errors, setErrors] = useState({});

  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates(prev => ({ ...prev, [key]: isLoading }));
    if (isLoading) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  }, []);

  const setError = useCallback((key, error) => {
    setErrors(prev => ({ ...prev, [key]: error }));
    setLoadingStates(prev => ({ ...prev, [key]: false }));
  }, []);

  const isLoading = useCallback((key) => Boolean(loadingStates[key]), [loadingStates]);
  const getError = useCallback((key) => errors[key], [errors]);

  const executeWithLoading = useCallback(async (key, asyncFunction) => {
    setLoading(key, true);
    try {
      const result = await asyncFunction();
      setLoading(key, false);
      return result;
    } catch (err) {
      setError(key, err);
      throw err;
    }
  }, [setLoading, setError]);

  return {
    setLoading,
    setError,
    isLoading,
    getError,
    executeWithLoading
  };
}