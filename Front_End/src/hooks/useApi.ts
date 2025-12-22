import { useState, useEffect, useCallback, useRef } from 'react';

// 简单的内存缓存
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

interface UseApiOptions {
  autoFetch?: boolean;
  retryOnError?: boolean;
  retryCount?: number;
  cache?: boolean;
  cacheTTL?: number; // 缓存时间（毫秒），默认5分钟
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  fetchData: () => Promise<T>;
  refetch: () => Promise<T>;
  clearError: () => void;
}

/**
 * 用于管理API请求的自定义Hook
 * @param apiFunction API请求函数
 * @param dependencies 依赖项数组，当这些值变化时会重新请求
 * @param options 配置选项
 * @returns API请求的状态和方法
 */
export function useApi<T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiOptions = {}
): UseApiResult<T> {
  const {
    autoFetch = true,
    retryOnError = false,
    retryCount = 3,
    cache: useCache = false,
    cacheTTL = 5 * 60 * 1000 // 默认5分钟
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);
  const cacheKeyRef = useRef<string>('');
  
  // 使用Ref存储apiFunction，避免因为函数引用变化导致的无限循环
  const apiFunctionRef = useRef(apiFunction);
  useEffect(() => {
    apiFunctionRef.current = apiFunction;
  }, [apiFunction]);

  // 生成缓存键
  useEffect(() => {
    if (useCache) {
      // 使用dependencies作为缓存键的核心，而不是函数字符串（因为函数字符串在混淆后可能不一致）
      cacheKeyRef.current = `api_cache_${JSON.stringify(dependencies)}`;
    }
  }, [dependencies, useCache]);

  // 实际的获取数据函数
  const fetchData = useCallback(async (isBackground = false): Promise<T> => {
    const now = Date.now();
    let cachedData = null;

    // 检查缓存 - 优先使用缓存数据，立即显示
    if (useCache && cacheKeyRef.current) {
      const cached = cache.get(cacheKeyRef.current);
      if (cached) {
        cachedData = cached.data;
        // 立即显示缓存数据，不等待API响应
        if (!data || JSON.stringify(data) !== JSON.stringify(cached.data)) {
          setData(cached.data);
        }
        
        // 如果缓存还没过期，且不是后台刷新，则不需要立即再次请求
        // 除非是强制刷新（通过refetch调用）
        if (now - cached.timestamp < cached.ttl && !isBackground) {
          setLoading(false);
          return cached.data;
        }
      }
    }

    // 只有在没有缓存数据的情况下，才显示加载状态
    if (!cachedData && !isBackground) {
      setLoading(true);
    }
    
    setError(null);

    try {
      const response = await apiFunctionRef.current();
      setData(response);
      setRetryAttempt(0); // 重置重试计数
      
      // 保存到缓存
      if (useCache && cacheKeyRef.current) {
        cache.set(cacheKeyRef.current, {
          data: response,
          timestamp: Date.now(),
          ttl: cacheTTL
        });
      }
      
      return response;
    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error(String(err));
      
      // 检查是否是服务器错误（500系列）
      const isServerError = (errorInstance as any).isServerError || 
                           (errorInstance as any).status >= 500;
      
      // 如果有缓存数据，错误时可以继续展示旧数据，只打印警告
      if (cachedData) {
        const userMessage = (errorInstance as any).userMessage || errorInstance.message;
        console.warn('API更新失败，继续使用缓存数据:', {
          message: userMessage,
          status: (errorInstance as any).status,
          isServerError,
          endpoint: (errorInstance as any).endpoint
        });
        // 对于服务器错误且有缓存的情况，不设置error，让用户继续使用缓存数据
        // 但可以设置一个轻量级的提示（如果需要的话）
        if (!isServerError) {
          setError(errorInstance);
        }
      } else {
        // 没有缓存数据时，设置错误
        setError(errorInstance);
        
        // 如果是服务器错误，提供更友好的提示和详细日志
        if (isServerError) {
          const errorDetails = (errorInstance as any).details;
          console.error('服务器错误:', {
            message: (errorInstance as any).userMessage || errorInstance.message,
            status: (errorInstance as any).status,
            statusText: (errorInstance as any).statusText,
            errorCode: errorDetails?.errorCode,
            details: errorDetails
          });
        }
      }
      
      // 处理错误重试逻辑
      if (retryOnError && retryAttempt < retryCount) {
        // 对于服务器错误，使用更长的重试延迟
        const delay = isServerError 
          ? (retryAttempt + 1) * 2000  // 服务器错误：2秒、4秒、6秒
          : (retryAttempt + 1) * 1000; // 其他错误：1秒、2秒、3秒
        
        console.log(`请求失败，${delay/1000}秒后重试 (${retryAttempt + 1}/${retryCount})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        setRetryAttempt(prev => prev + 1);
        return fetchData(isBackground); // 递归重试
      }
      
      throw errorInstance;
    } finally {
      setLoading(false);
    }
  }, [retryOnError, retryCount, retryAttempt, useCache, cacheTTL]); // 移除了 data，防止循环

  // 重新获取数据（重置重试计数）
  const refetch = useCallback(async (): Promise<T> => {
    setRetryAttempt(0);
    return fetchData();
  }, [fetchData]);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 自动获取数据 - 优化：立即检查缓存，后台更新
  useEffect(() => {
    if (autoFetch) {
      // 先同步检查缓存，立即显示
      if (useCache && cacheKeyRef.current) {
        const cached = cache.get(cacheKeyRef.current);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
          setData(cached.data);
          setLoading(false);
        }
      }
      // 然后异步获取最新数据
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);

  return {
    data,
    loading,
    error,
    fetchData,
    refetch,
    clearError
  };
}

/**
 * 用于批量管理多个API请求的Hook
 * @param apiFunctions 多个API请求函数
 * @param options 配置选项
 * @returns 批量请求的状态和方法
 */
export function useBatchApi<T extends any[]>(
  apiFunctions: (() => Promise<any>)[],
  options: UseApiOptions = {}
): {
  data: { [index: number]: T[number] | null };
  loading: boolean;
  errors: (Error | null)[];
  fetchAll: () => Promise<T>;
  refetchAll: () => Promise<T>;
} {
  const [data, setData] = useState<{ [index: number]: T[number] | null }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<(Error | null)[]>([]);

  const fetchAll = useCallback(async (): Promise<T> => {
    setLoading(true);
    setErrors(new Array(apiFunctions.length).fill(null));

    try {
      const results = await Promise.allSettled(
        apiFunctions.map((fn, index) =>
          fn().then(result => {
            setData(prev => ({ ...prev, [index]: result }));
            return result;
          }).catch(error => {
            const errorInstance = error instanceof Error ? error : new Error(String(error));
            setErrors(prev => {
              const newErrors = [...prev];
              newErrors[index] = errorInstance;
              return newErrors;
            });
            throw errorInstance;
          })
        )
      );

      // 检查是否有失败的请求
      const failedResults = results.filter(result => result.status === 'rejected');
      if (failedResults.length > 0) {
        throw new Error(`部分请求失败 (${failedResults.length}/${results.length})`);
      }

      const successfulResults = results.map(result => 
        result.status === 'fulfilled' ? result.value : null
      ) as T;

      return successfulResults;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiFunctions]);

  const refetchAll = useCallback(async (): Promise<T> => {
    setData({});
    return fetchAll();
  }, [fetchAll]);

  // 自动获取数据
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchAll();
    }
  }, [fetchAll, options.autoFetch]);

  return {
    data,
    loading,
    errors,
    fetchAll,
    refetchAll
  };
}
