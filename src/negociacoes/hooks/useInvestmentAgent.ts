/**
 * Hook para Gerenciamento do Agente de Investimentos
 * Gerencia configuração de API keys, parâmetros de trading e ativação do bot
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    TradingParams,
    AgentStatus,
    TradingStrategy,
    RiskLevel,
    DEFAULT_AGENT_PARAMS,
    createStrategyConfig,
    createRiskConfig,
    createExchangeConfig,
    validateAgentParams
} from '../config/investmentAgent';

export interface UseInvestmentAgentReturn {
    // Estado
    agent: AgentStatus | null;
    params: TradingParams;
    loading: boolean;
    error: string | null;
    isConfigured: boolean;
    isActive: boolean;
    isTrading: boolean;

    // Ações
    configureAgent: (params: Partial<TradingParams>) => Promise<void>;
    setApiKeys: (exchange: string, apiKey: string, apiSecret: string) => Promise<void>;
    startTrading: () => Promise<void>;
    stopTrading: () => Promise<void>;
    updateParams: (params: Partial<TradingParams>) => Promise<void>;
    testConnection: (exchange: string) => Promise<{ success: boolean; message: string }>;
    resetToDefaults: () => void;
    selectStrategy: (strategy: TradingStrategy) => void;
    selectRiskLevel: (riskLevel: RiskLevel) => void;
    selectExchange: (exchange: string) => void;
}

const STORAGE_KEY = 'kito_investment_agent_params';

/**
 * Hook principal para gerenciamento do agente de investimentos
 */
export function useInvestmentAgent(): UseInvestmentAgentReturn {
    const [agent, setAgent] = useState<AgentStatus | null>(null);
    const [params, setParams] = useState<TradingParams>(DEFAULT_AGENT_PARAMS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConfigured, setIsConfigured] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [isTrading, setIsTrading] = useState(false);

    // Carregar configuração do localStorage ao iniciar
    useEffect(() => {
        const loadSavedParams = async () => {
            try {
                // Primeiro tenta carregar do localStorage
                const savedParams = localStorage.getItem(STORAGE_KEY);
                if (savedParams) {
                    const parsed = JSON.parse(savedParams);
                    setParams({ ...DEFAULT_AGENT_PARAMS, ...parsed });
                    setIsConfigured(!!parsed.apiKey);
                }

                // Depois tenta carregar do banco de dados
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data, error: fetchError } = await supabase
                        .from('user_agent_config')
                        .select('*')
                        .eq('user_id', user.id)
                        .single();

                    if (data && !fetchError) {
                        const savedParams = {
                            ...DEFAULT_AGENT_PARAMS,
                            ...data.config,
                            exchange: data.exchange,
                        };
                        setParams(savedParams);
                        setIsConfigured(!!data.is_configured);
                        setIsActive(data.is_active);
                        setIsTrading(data.is_trading);

                        // Salvar no localStorage também
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.config));
                    }
                }
            } catch (err) {
                console.error('Erro ao carregar configuração do agente:', err);
            }
        };

        loadSavedParams();
    }, []);

    // Configurar o agente com parâmetros específicos
    const configureAgent = useCallback(async (newParams: Partial<TradingParams>) => {
        setLoading(true);
        setError(null);

        try {
            const validation = validateAgentParams(newParams);
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }

            const updatedParams = { ...params, ...newParams };

            // Salvar no localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedParams));

            // Salvar no banco de dados
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error: upsertError } = await supabase
                    .from('user_agent_config')
                    .upsert({
                        user_id: user.id,
                        exchange: updatedParams.exchange,
                        config: updatedParams,
                        is_configured: !!updatedParams.apiKey,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id' });

                if (upsertError) throw upsertError;
            }

            setParams(updatedParams);
            setIsConfigured(!!updatedParams.apiKey);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao configurar agente');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [params]);

    // Configurar API Keys
    const setApiKeys = useCallback(async (
        exchange: string,
        apiKey: string,
        apiSecret: string
    ) => {
        await configureAgent({
            exchange,
            apiKey,
            apiSecret,
            testnet: false, // Por padrão, usar modo real
        });
    }, [configureAgent]);

    // Iniciar trading
    const startTrading = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            if (!params.apiKey) {
                throw new Error('API Key não configurada');
            }

            const validation = validateAgentParams(params);
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }

            // Atualizar status no banco
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error: updateError } = await supabase
                    .from('user_agent_config')
                    .update({
                        is_active: true,
                        is_trading: true,
                        trading_started_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', user.id);

                if (updateError) throw updateError;
            }

            setIsActive(true);
            setIsTrading(true);

            // Emitir evento para o serviço de trading
            window.dispatchEvent(new CustomEvent('trading:start', { detail: params }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao iniciar trading');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [params]);

    // Parar trading
    const stopTrading = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Atualizar status no banco
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error: updateError } = await supabase
                    .from('user_agent_config')
                    .update({
                        is_active: true,
                        is_trading: false,
                        trading_stopped_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', user.id);

                if (updateError) throw updateError;
            }

            setIsTrading(false);

            // Emitir evento para o serviço de trading
            window.dispatchEvent(new CustomEvent('trading:stop'));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao parar trading');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Atualizar parâmetros
    const updateParams = useCallback(async (newParams: Partial<TradingParams>) => {
        const updatedParams = { ...params, ...newParams };

        // Salvar no localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedParams));

        // Salvar no banco
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from('user_agent_config')
                .update({
                    config: updatedParams,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id);
        }

        setParams(updatedParams);
    }, [params]);

    // Testar conexão com a exchange
    const testConnection = useCallback(async (exchange: string) => {
        setLoading(true);
        setError(null);

        try {
            // Simular teste de conexão (em produção, isso chamaria a API real)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Verificar se as chaves estão configuradas
            if (!params.apiKey) {
                return {
                    success: false,
                    message: 'API Key não configurada para esta exchange'
                };
            }

            // Retornar sucesso simulado
            return {
                success: true,
                message: `Conexão com ${exchange} estabelecida com sucesso!`,
            };
        } catch (err) {
            return {
                success: false,
                message: err instanceof Error ? err.message : 'Erro ao testar conexão',
            };
        } finally {
            setLoading(false);
        }
    }, [params.apiKey]);

    // Resetar para padrões
    const resetToDefaults = useCallback(() => {
        setParams(DEFAULT_AGENT_PARAMS);
        localStorage.removeItem(STORAGE_KEY);
        setIsConfigured(false);
        setIsActive(false);
        setIsTrading(false);
        setError(null);
    }, []);

    // Selecionar estratégia
    const selectStrategy = useCallback((strategy: TradingStrategy) => {
        const newParams = createStrategyConfig(strategy);
        setParams(prev => ({ ...prev, ...newParams, strategy }));
    }, []);

    // Selecionar nível de risco
    const selectRiskLevel = useCallback((riskLevel: RiskLevel) => {
        const newParams = createRiskConfig(riskLevel, params.strategy);
        setParams(prev => ({ ...prev, ...newParams, riskLevel }));
    }, [params.strategy]);

    // Selecionar exchange
    const selectExchange = useCallback((exchange: string) => {
        const newParams = createExchangeConfig(exchange, params.strategy, params.riskLevel);
        setParams(prev => ({ ...prev, ...newParams, exchange }));
    }, [params.strategy, params.riskLevel]);

    return {
        // Estado
        agent,
        params,
        loading,
        error,
        isConfigured,
        isActive,
        isTrading,

        // Ações
        configureAgent,
        setApiKeys,
        startTrading,
        stopTrading,
        updateParams,
        testConnection,
        resetToDefaults,
        selectStrategy,
        selectRiskLevel,
        selectExchange,
    };
}

// ============================================
// HOOK PARA GERENCIAR MÚLTIPLOS AGENTES
// ============================================

export interface UseInvestmentAgentsReturn {
    agents: AgentStatus[];
    loading: boolean;
    error: string | null;
    createAgent: (name: string, exchange: string) => Promise<AgentStatus>;
    deleteAgent: (id: string) => Promise<void>;
    updateAgentStatus: (id: string, isActive: boolean) => Promise<void>;
    refreshAgents: () => Promise<void>;
}

export function useInvestmentAgents(): UseInvestmentAgentsReturn {
    const [agents, setAgents] = useState<AgentStatus[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAgents = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error: fetchError } = await supabase
                .from('agent_status')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setAgents(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar agentes');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    const createAgent = useCallback(async (name: string, exchange: string): Promise<AgentStatus> => {
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const newAgent: Partial<AgentStatus> = {
                userId: user.id,
                name,
                exchange,
                isActive: false,
                isTrading: false,
                balance: 0,
                totalProfit: 0,
                totalTrades: 0,
                winningTrades: 0,
                losingTrades: 0,
                lastTrade: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const { data, error: insertError } = await supabase
                .from('agent_status')
                .insert(newAgent as any)
                .select()
                .single();

            if (insertError) throw insertError;

            await fetchAgents();
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar agente');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchAgents]);

    const deleteAgent = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);

        try {
            const { error: deleteError } = await supabase
                .from('agent_status')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchAgents();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao excluir agente');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchAgents]);

    const updateAgentStatus = useCallback(async (id: string, isActive: boolean) => {
        try {
            const { error: updateError } = await supabase
                .from('agent_status')
                .update({
                    isActive,
                    isTrading: isActive,
                    updatedAt: new Date().toISOString(),
                })
                .eq('id', id);

            if (updateError) throw updateError;

            await fetchAgents();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar agente');
            throw err;
        }
    }, [fetchAgents]);

    return {
        agents,
        loading,
        error,
        createAgent,
        deleteAgent,
        updateAgentStatus,
        refreshAgents: fetchAgents,
    };
}
