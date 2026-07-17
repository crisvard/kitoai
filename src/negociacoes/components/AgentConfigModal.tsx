/**
 * Componente de Configuração do Agente de Investimentos
 * Modal para configurar API keys, estratégia e parâmetros de trading
 */

import React, { useState, useEffect } from 'react';
import {
    X,
    Key,
    Settings,
    Shield,
    AlertTriangle,
    CheckCircle,
    Loader2,
    ExternalLink,
    Info
} from 'lucide-react';
import { useInvestmentAgent } from '../hooks/useInvestmentAgent';
import {
    EXCHANGE_LIST,
    getExchangeConfig
} from '../config/exchanges';
import {
    TradingStrategy,
    RiskLevel,
    STRATEGY_CONFIGS,
    RISK_CONFIGS,
    getRecommendedPairs
} from '../config/investmentAgent';
import { getPairsByQuote } from '../config/tradingPairs';

interface AgentConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ConfigStep = 'exchange' | 'api_keys' | 'strategy' | 'risk' | 'pairs' | 'review';

export function AgentConfigModal({ isOpen, onClose }: AgentConfigModalProps) {
    const {
        params,
        loading,
        error,
        isConfigured,
        isActive,
        selectExchange,
        selectStrategy,
        selectRiskLevel,
        setApiKeys,
        configureAgent,
        startTrading,
        testConnection,
        resetToDefaults,
    } = useInvestmentAgent();

    const [step, setStep] = useState<ConfigStep>('exchange');
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [testnet, setTestnet] = useState(true);
    const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
    const [connectionTested, setConnectionTested] = useState(false);
    const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);

    // Resetar estado quando o modal abre
    useEffect(() => {
        if (isOpen) {
            setStep('exchange');
            setApiKey(params.apiKey || '');
            setApiSecret(params.apiSecret || '');
            setTestnet(params.testnet);
            setSelectedPairs(params.tradingPairs);
            setConnectionTested(false);
            setConnectionResult(null);
        }
    }, [isOpen, params]);

    const currentExchange = getExchangeConfig(params.exchange);

    const handleExchangeSelect = (exchange: string) => {
        selectExchange(exchange);
        setStep('api_keys');
        setConnectionTested(false);
        setConnectionResult(null);
    };

    const handleApiKeysSubmit = async () => {
        if (!apiKey || !apiSecret) return;

        try {
            await setApiKeys(params.exchange, apiKey, apiSecret);
            setConnectionTested(true);
        } catch (err) {
            console.error('Erro ao salvar API keys:', err);
        }
    };

    const handleTestConnection = async () => {
        const result = await testConnection(params.exchange);
        setConnectionResult(result);
    };

    const handleStrategySelect = (strategy: TradingStrategy) => {
        selectStrategy(strategy);
        // Atualizar pares recomendados baseado na estratégia
        const recommended = getRecommendedPairs(strategy);
        setSelectedPairs(recommended.slice(0, 5)); // Selecionar até 5 pares
        setStep('risk');
    };

    const handleRiskSelect = (risk: RiskLevel) => {
        selectRiskLevel(risk);
        setStep('pairs');
    };

    const handlePairsSubmit = async () => {
        await configureAgent({
            tradingPairs: selectedPairs,
        });
        setStep('review');
    };

    const handleStartTrading = async () => {
        try {
            await startTrading();
            onClose();
        } catch (err) {
            console.error('Erro ao iniciar trading:', err);
        }
    };

    const togglePair = (pair: string) => {
        if (selectedPairs.includes(pair)) {
            setSelectedPairs(selectedPairs.filter(p => p !== pair));
        } else {
            setSelectedPairs([...selectedPairs, pair]);
        }
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-6">
            {['exchange', 'api_keys', 'strategy', 'risk', 'pairs', 'review'].map((s, i) => (
                <React.Fragment key={s}>
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step === s
                                ? 'bg-blue-600 text-white'
                                : ['exchange', 'api_keys', 'strategy', 'risk', 'pairs', 'review'].indexOf(step) > i
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-500'
                            }`}
                    >
                        {i + 1}
                    </div>
                    {i < 5 && (
                        <div className={`w-8 h-0.5 mx-1 ${['exchange', 'api_keys', 'strategy', 'risk', 'pairs', 'review'].indexOf(step) > i ? 'bg-green-600' : 'bg-gray-200'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    const renderExchangeStep = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Selecione a Exchange</h3>
            <p className="text-sm text-gray-500">Escolha a corretora onde você possui conta e deseja operar.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {EXCHANGE_LIST.map((exchange) => (
                    <button
                        key={exchange.id}
                        onClick={() => handleExchangeSelect(exchange.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all hover:border-blue-500 ${params.exchange === exchange.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{exchange.logo}</span>
                            <div>
                                <p className="font-medium text-gray-900">{exchange.displayName}</p>
                                <p className="text-xs text-gray-500">{exchange.description}</p>
                            </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {exchange.features.slice(0, 3).map((feature) => (
                                <span key={feature} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                    {feature}
                                </span>
                            ))}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderApiKeysStep = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Configure as API Keys</h3>
                    <p className="text-sm text-gray-500">
                        Adicione suas credenciais da {currentExchange?.displayName}
                    </p>
                </div>
                <button
                    onClick={() => setTestnet(!testnet)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${testnet
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                >
                    {testnet ? '🧪 Testnet' : '💰 Produção'}
                </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium">Como criar API Keys na {currentExchange?.displayName}:</p>
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                            <li>Acesse as configurações da sua conta</li>
                            <li> Vá para "API Management" ou "Gerenciamento de API"</li>
                            <li>Crie uma nova chave com permissões de trading</li>
                            <li>Copie a API Key e API Secret</li>
                        </ol>
                        <a
                            href={currentExchange?.apiKeysDocs}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:underline"
                        >
                            Ver documentação <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Key
                    </label>
                    <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Cole sua API Key aqui"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Secret
                    </label>
                    <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="password"
                            value={apiSecret}
                            onChange={(e) => setApiSecret(e.target.value)}
                            placeholder="Cole sua API Secret aqui"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w5 text-yellow--5 h-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                        <strong>Importante:</strong> Nunca compartilhe suas API Keys.
                        Certifique-se de habilitar apenas permissões de leitura e trading,
                        nunca saque.
                    </p>
                </div>

                {connectionResult && (
                    <div className={`p-4 rounded-lg flex items-center gap-2 ${connectionResult.success
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                        }`}>
                        {connectionResult.success ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={connectionResult.success ? 'text-green-800' : 'text-red-800'}>
                            {connectionResult.message}
                        </span>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={handleTestConnection}
                        disabled={!apiKey || !apiSecret || loading}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Testar Conexão'}
                    </button>
                    <button
                        onClick={handleApiKeysSubmit}
                        disabled={!apiKey || !apiSecret || loading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Salvar e Continuar
                    </button>
                </div>
            </div>
        </div>
    );

    const renderStrategyStep = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Selecione a Estratégia</h3>
            <p className="text-sm text-gray-500">Escolha a estratégia de trading mais adequada ao seu perfil.</p>

            <div className="space-y-3">
                {(Object.keys(STRATEGY_CONFIGS) as TradingStrategy[]).map((strategy) => (
                    <button
                        key={strategy}
                        onClick={() => handleStrategySelect(strategy)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:border-blue-500 ${params.strategy === strategy
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 capitalize">
                                    {strategy.replace('_', ' ')}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {getStrategyDescription(strategy)}
                                </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${STRATEGY_CONFIGS[strategy].riskLevel === 'conservative'
                                    ? 'bg-green-100 text-green-800'
                                    : STRATEGY_CONFIGS[strategy].riskLevel === 'moderate'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                {STRATEGY_CONFIGS[strategy].riskLevel}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderRiskStep = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Selecione o Nível de Risco</h3>
            <p className="text-sm text-gray-500">Defina seu apetite por risco para o trading automatizado.</p>

            <div className="space-y-3">
                {(['conservative', 'moderate', 'aggressive'] as RiskLevel[]).map((risk) => (
                    <button
                        key={risk}
                        onClick={() => handleRiskSelect(risk)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:border-blue-500 ${params.riskLevel === risk
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 capitalize">{risk}</p>
                                <p className="text-sm text-gray-500 mt-1">{getRiskDescription(risk)}</p>
                            </div>
                            <div className="text-right text-sm">
                                <p className="text-gray-600">
                                    Stop Loss: <span className="font-medium">{RISK_CONFIGS[risk].stopLossPercent}%</span>
                                </p>
                                <p className="text-gray-600">
                                    Posição máx: <span className="font-medium">{RISK_CONFIGS[risk].maxPositionSize}%</span>
                                </p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderPairsStep = () => {
        const availablePairs = getPairsByQuote(params.baseCurrency || 'USDT');

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Selecione os Pares</h3>
                <p className="text-sm text-gray-500">
                    Escolha os pares de trading que o agente irá operar.
                </p>

                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                        <strong>Moeda base:</strong> {params.baseCurrency || 'USDT'}
                    </p>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                    {availablePairs.slice(0, 50).map((pair) => (
                        <label
                            key={pair.symbol}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={selectedPairs.includes(pair.symbol)}
                                onChange={() => togglePair(pair.symbol)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="font-medium">{pair.symbol}</span>
                            <span className="text-gray-500 text-sm">- {pair.name}</span>
                        </label>
                    ))}
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                        {selectedPairs.length} pares selecionados
                    </span>
                    <button
                        onClick={() => {
                            const recommended = getRecommendedPairs(params.strategy);
                            setSelectedPairs(recommended);
                        }}
                        className="text-blue-600 hover:underline"
                    >
                        Usar recomendados
                    </button>
                </div>

                <button
                    onClick={handlePairsSubmit}
                    disabled={selectedPairs.length === 0}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Continuar
                </button>
            </div>
        );
    };

    const renderReviewStep = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Revisar Configuração</h3>
            <p className="text-sm text-gray-500">Revise as configurações antes de iniciar o trading.</p>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                    <span className="text-gray-600">Exchange:</span>
                    <span className="font-medium">{currentExchange?.displayName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Modo:</span>
                    <span className="font-medium">{testnet ? '🧪 Testnet' : '💰 Produção'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Estratégia:</span>
                    <span className="font-medium capitalize">{params.strategy.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Risco:</span>
                    <span className="font-medium capitalize">{params.riskLevel}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Pares:</span>
                    <span className="font-medium">{selectedPairs.length} pares</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Stop Loss:</span>
                    <span className="font-medium">{params.stopLossPercent}%</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Take Profit:</span>
                    <span className="font-medium">{params.takeProfitPercent}%</span>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                    {error}
                </div>
            )}

            <button
                onClick={handleStartTrading}
                disabled={loading}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        <Settings className="w-5 h-5" />
                        Iniciar Agente de Trading
                    </>
                )}
            </button>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Configurar Agente de Investimentos
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {renderStepIndicator()}

                    {step === 'exchange' && renderExchangeStep()}
                    {step === 'api_keys' && renderApiKeysStep()}
                    {step === 'strategy' && renderStrategyStep()}
                    {step === 'risk' && renderRiskStep()}
                    {step === 'pairs' && renderPairsStep()}
                    {step === 'review' && renderReviewStep()}
                </div>

                {/* Footer */}
                {step !== 'review' && (
                    <div className="p-4 border-t bg-gray-50 flex justify-between">
                        <button
                            onClick={() => {
                                const steps: ConfigStep[] = ['exchange', 'api_keys', 'strategy', 'risk', 'pairs', 'review'];
                                const currentIndex = steps.indexOf(step);
                                if (currentIndex > 0) {
                                    setStep(steps[currentIndex - 1]);
                                }
                            }}
                            disabled={step === 'exchange'}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Voltar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Funções auxiliares
function getStrategyDescription(strategy: TradingStrategy): string {
    const descriptions: Record<TradingStrategy, string> = {
        trend_following: 'Segue tendências de mercado usando médias móveis. Ideal para mercados em movimento.',
        mean_reversion: 'Opera baseado na premissa de que preços retornam à média. Melhor em mercados laterais.',
        grid_trading: 'Coloca ordens em níveis pré-definidos. Ideal para mercados sem tendência clara.',
        dca: 'Compra automaticamente em intervalos regulares. Minimiza impacto da volatilidade.',
        momentum: 'Entradas baseadas em força do movimento. Rápido e agressivo.',
        scalping: 'Operações rápidas para ganhos pequenos. Requer atenção constante.',
        swing_trading: 'Posições de médio prazo. Menos estresse que scalping.',
        custom: 'Configure seus próprios parâmetros.',
    };
    return descriptions[strategy];
}

function getRiskDescription(risk: RiskLevel): string {
    const descriptions: Record<RiskLevel, string> = {
        conservative: 'Baixo risco, retornos mais seguros. Ideal para iniciantes.',
        moderate: 'Equilíbrio entre risco e retorno. Recomendado para a maioria.',
        aggressive: 'Alto risco, maior potencial de lucro. Para traders experientes.',
    };
    return descriptions[risk];
}

export default AgentConfigModal;
