import { useCallback, useState } from 'react';
import { createExchangeClient } from '../services/exchange-api';
import { ExchangeApiClient, Portfolio, Transaction } from '../types';

interface UseExchangeApiReturn {
  client: ExchangeApiClient | null;
  loading: boolean;
  error: string | null;
  balance: Record<string, number> | null;
  portfolio: Portfolio[] | null;
  transactions: Transaction[] | null;
  initializeClient: (exchange: string, apiKey: string, apiSecret: string) => void;
  fetchBalance: () => Promise<void>;
  fetchPortfolio: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  placeBuyOrder: (symbol: string, quantity: number, price: number) => Promise<string>;
  placeSellOrder: (symbol: string, quantity: number, price: number) => Promise<string>;
}

export function useExchangeApi(): UseExchangeApiReturn {
  const [client, setClient] = useState<ExchangeApiClient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<Record<string, number> | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  const initializeClient = useCallback((exchange: string, apiKey: string, apiSecret: string) => {
    try {
      const newClient = createExchangeClient(exchange, apiKey, apiSecret);
      setClient(newClient);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize client');
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!client) {
      setError('Client not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const balanceData = await client.getBalance();
      setBalance(balanceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, [client]);

  const fetchPortfolio = useCallback(async () => {
    if (!client) {
      setError('Client not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const portfolioData = await client.getPortfolio();
      setPortfolio(portfolioData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  }, [client]);

  const fetchTransactions = useCallback(async () => {
    if (!client) {
      setError('Client not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const transactionData = await client.getTransactionHistory();
      setTransactions(transactionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [client]);

  const placeBuyOrder = useCallback(
    async (symbol: string, quantity: number, price: number): Promise<string> => {
      if (!client) {
        throw new Error('Client not initialized');
      }

      setLoading(true);
      setError(null);

      try {
        const orderId = await client.placeBuyOrder(symbol, quantity, price);
        return orderId;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to place buy order';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const placeSellOrder = useCallback(
    async (symbol: string, quantity: number, price: number): Promise<string> => {
      if (!client) {
        throw new Error('Client not initialized');
      }

      setLoading(true);
      setError(null);

      try {
        const orderId = await client.placeSellOrder(symbol, quantity, price);
        return orderId;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to place sell order';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  return {
    client,
    loading,
    error,
    balance,
    portfolio,
    transactions,
    initializeClient,
    fetchBalance,
    fetchPortfolio,
    fetchTransactions,
    placeBuyOrder,
    placeSellOrder,
  };
}
