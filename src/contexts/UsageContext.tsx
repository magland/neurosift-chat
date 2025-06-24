import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface UsageStatus {
  model: string;
  dailyLimit: number;
  currentUsage: number;
  available: boolean;
  remainingBudget: number;
}

interface UsageContextType {
  usageStatus: UsageStatus[];
  isLoading: boolean;
  error: string | null;
  getModelStatus: (model: string) => UsageStatus | undefined;
  isModelAvailable: (model: string) => boolean;
  refreshUsage: () => void;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

interface UsageProviderProps {
  children: ReactNode;
}

export function UsageProvider({ children }: UsageProviderProps) {
  const [usageStatus, setUsageStatus] = useState<UsageStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://neurosift-chat-api.vercel.app/api/usage');
      if (!response.ok) {
        throw new Error('Failed to fetch usage status');
      }

      const data = await response.json();
      setUsageStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching usage:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const getModelStatus = useCallback((model: string) => {
    return usageStatus.find(status => status.model === model);
  }, [usageStatus]);

  const isModelAvailable = useCallback((model: string) => {
    const status = getModelStatus(model);
    return status?.available ?? true; // Default to available if not found
  }, [getModelStatus]);

  const refreshUsage = useCallback(() => {
    fetchUsage();
  }, [fetchUsage]);

  const value: UsageContextType = {
    usageStatus,
    isLoading,
    error,
    getModelStatus,
    isModelAvailable,
    refreshUsage
  };

  return (
    <UsageContext.Provider value={value}>
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage(): UsageContextType {
  const context = useContext(UsageContext);
  if (context === undefined) {
    throw new Error('useUsage must be used within a UsageProvider');
  }
  return context;
}
