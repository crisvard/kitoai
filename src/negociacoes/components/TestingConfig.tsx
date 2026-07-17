import { useState } from 'react';
import { TestTube, Play, Pause, Trash2, Save, X, CheckCircle, XCircle, AlertCircle, RefreshCw, Settings, Activity, Target, Zap, Plus, Edit, BarChart3, Clock, FileText } from 'lucide-react';

interface TestCase {
    id: string;
    name: string;
    type: 'unit' | 'integration' | 'e2e' | 'performance';
    status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
    duration: number; // em ms
    lastRun: string;
    errorMessage?: string;
    config: Record<string, any>;
}

interface TestSuite {
    id: string;
    name: string;
    tests: TestCase[];
    enabled: boolean;
    lastRun: string;
    passRate: number;
}

export default function TestingConfigComponent() {
    const [testSuites, setTestSuites] = useState<TestSuite[]>([
        {
            id: '1',
            name: 'Scraper Tests',
            tests: [
                {
                    id: '1-1',
                    name: 'Betano Scraper - Conexão',
                    type: 'unit',
                    status: 'passed',
                    duration: 1250,
                    lastRun: new Date().toISOString(),
                    config: {},
                },
                {
                    id: '1-2',
                    name: 'Betano Scraper - Odds',
                    type: 'unit',
                    status: 'passed',
                    duration: 2340,
                    lastRun: new Date().toISOString(),
                    config: {},
                },
                {
                    id: '1-3',
                    name: 'Bet365 Scraper - Conexão',
                    type: 'unit',
                    status: 'failed',
                    duration: 5000,
                    lastRun: new Date().toISOString(),
                    errorMessage: 'Timeout ao conectar',
                    config: {},
                },
            ],
            enabled: true,
            lastRun: new Date().toISOString(),
            passRate: 66.7,
        },
        {
            id: '2',
            name: 'API Tests',
            tests: [
                {
                    id: '2-1',
                    name: 'GET /api/odds',
                    type: 'integration',
                    status: 'passed',
                    duration: 450,
                    lastRun: new Date().toISOString(),
                    config: {},
                },
                {
                    id: '2-2',
                    name: 'POST /api/scrapers',
                    type: 'integration',
                    status: 'passed',
                    duration: 320,
                    lastRun: new Date().toISOString(),
                    config: {},
                },
            ],
            enabled: true,
            lastRun: new Date().toISOString(),
            passRate: 100,
        },
        {
            id: '3',
            name: 'Performance Tests',
            tests: [
                {
                    id: '3-1',
                    name: 'Scraping Performance',
                    type: 'performance',
                    status: 'passed',
                    duration: 15000,
                    lastRun: new Date().toISOString(),
                    config: { requests: 100, concurrent: 10 },
                },
            ],
            enabled: true,
            lastRun: new Date().toISOString(),
            passRate: 100,
        },
    ]);

    const [showAddSuite, setShowAddSuite] = useState(false);
    const [newSuiteName, setNewSuiteName] = useState('');

    const handleAddSuite = () => {
        if (!newSuiteName) return;

        const suite: TestSuite = {
            id: Date.now().toString(),
            name: newSuiteName,
            tests: [],
            enabled: true,
            lastRun: '',
            passRate: 0,
        };

        setTestSuites([...testSuites, suite]);
        setNewSuiteName('');
        setShowAddSuite(false);
    };

    const handleToggleSuite = (id: string) => {
        setTestSuites(testSuites.map(s =>
            s.id === id
                ? { ...s, enabled: !s.enabled }
                : s
        ));
    };

    const handleDeleteSuite = (id: string) => {
        setTestSuites(testSuites.filter(s => s.id !== id));
    };

    const handleRunSuite = (id: string) => {
        setTestSuites(testSuites.map(s =>
            s.id === id
                ? {
                    ...s,
                    tests: s.tests.map(t => ({ ...t, status: 'running' as const })),
                }
                : s
        ));

        // Simular execução
        setTimeout(() => {
            setTestSuites(prev => prev.map(s =>
                s.id === id
                    ? {
                        ...s,
                        tests: s.tests.map(t => ({
                            ...t,
                            status: Math.random() > 0.2 ? 'passed' as const : 'failed' as const,
                            lastRun: new Date().toISOString(),
                        })),
                        lastRun: new Date().toISOString(),
                        passRate: Math.round((s.tests.filter(t => t.status === 'passed').length / s.tests.length) * 100),
                    }
                    : s
            ));
        }, 3000);
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return 'Nunca';
        const date = new Date(isoString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatTime = (isoString: string) => {
        if (!isoString) return 'Nunca';
        const date = new Date(isoString);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}m`;
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'unit':
                return 'Unitário';
            case 'integration':
                return 'Integração';
            case 'e2e':
                return 'E2E';
            case 'performance':
                return 'Performance';
            default:
                return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'unit':
                return 'text-blue-400';
            case 'integration':
                return 'text-green-400';
            case 'e2e':
                return 'text-purple-400';
            case 'performance':
                return 'text-orange-400';
            default:
                return 'text-gray-400';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'passed':
                return 'text-green-400';
            case 'failed':
                return 'text-red-400';
            case 'running':
                return 'text-yellow-400';
            case 'skipped':
                return 'text-gray-400';
            default:
                return 'text-gray-400';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'passed':
                return 'bg-green-500/10 border-green-500/30';
            case 'failed':
                return 'bg-red-500/10 border-red-500/30';
            case 'running':
                return 'bg-yellow-500/10 border-yellow-500/30';
            case 'skipped':
                return 'bg-white/5 border-white/10';
            default:
                return 'bg-white/5 border-white/10';
        }
    };

    const totalTests = testSuites.reduce((sum, s) => sum + s.tests.length, 0);
    const passedTests = testSuites.reduce((sum, s) =>
        sum + s.tests.filter(t => t.status === 'passed').length, 0
    );
    const failedTests = testSuites.reduce((sum, s) =>
        sum + s.tests.filter(t => t.status === 'failed').length, 0
    );
    const overallPassRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Configuração de Testes</h2>
                <p className="text-gray-400">Gerencie e execute testes automatizados</p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <TestTube className="text-[#c4d82e]" size={18} />
                        <span className="text-gray-400 text-sm">Total Testes</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{totalTests}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Passaram</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{passedTests}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle className="text-red-400" size={18} />
                        <span className="text-gray-400 text-sm">Falharam</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{failedTests}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="text-green-400" size={18} />
                        <span className="text-gray-400 text-sm">Taxa de Sucesso</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{overallPassRate}%</p>
                </div>
            </div>

            {/* Suites de Teste */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Suites de Teste</h3>
                    <button
                        onClick={() => setShowAddSuite(true)}
                        className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                    >
                        <Plus size={18} />
                        Adicionar Suite
                    </button>
                </div>

                {showAddSuite && (
                    <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                        <div>
                            <label className="text-gray-400 text-xs mb-1 block">Nome da Suite</label>
                            <input
                                type="text"
                                value={newSuiteName}
                                onChange={(e) => setNewSuiteName(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c4d82e]"
                                placeholder="Nome da suite"
                            />
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={handleAddSuite}
                                className="flex items-center gap-2 bg-[#c4d82e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c4d82e]/90 transition-colors"
                            >
                                <Save size={18} />
                                Criar
                            </button>
                            <button
                                onClick={() => setShowAddSuite(false)}
                                className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors"
                            >
                                <X size={18} />
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {testSuites.map(suite => (
                        <div
                            key={suite.id}
                            className={`rounded-xl p-4 border transition-all duration-200 ${suite.enabled
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-white/5 border-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <TestTube className={suite.enabled ? 'text-green-400' : 'text-gray-400'} size={20} />
                                    <div>
                                        <h4 className="text-white font-bold">{suite.name}</h4>
                                        <span className="text-gray-400 text-xs">
                                            {suite.tests.length} testes • {suite.passRate}% passaram
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleRunSuite(suite.id)}
                                        className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        <Play size={14} className="text-white" />
                                    </button>
                                    <button
                                        onClick={() => handleToggleSuite(suite.id)}
                                        className={`p-1.5 rounded-lg transition-colors ${suite.enabled
                                                ? 'bg-green-500/20 hover:bg-green-500/30'
                                                : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        {suite.enabled ? (
                                            <CheckCircle size={14} className="text-green-400" />
                                        ) : (
                                            <XCircle size={14} className="text-gray-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSuite(suite.id)}
                                        className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                                    >
                                        <Trash2 size={14} className="text-red-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {suite.tests.map(test => (
                                    <div
                                        key={test.id}
                                        className={`flex items-center justify-between p-2 rounded-lg ${getStatusBg(test.status)}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {test.status === 'passed' ? (
                                                <CheckCircle className="text-green-400" size={14} />
                                            ) : test.status === 'failed' ? (
                                                <XCircle className="text-red-400" size={14} />
                                            ) : test.status === 'running' ? (
                                                <RefreshCw className="text-yellow-400 animate-spin" size={14} />
                                            ) : (
                                                <Clock className="text-gray-400" size={14} />
                                            )}
                                            <span className="text-white text-sm">{test.name}</span>
                                            <span className={`text-xs ${getTypeColor(test.type)}`}>
                                                {getTypeLabel(test.type)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 text-xs">{formatDuration(test.duration)}</span>
                                            <span className="text-gray-400 text-xs">{formatTime(test.lastRun)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {suite.tests.some(t => t.status === 'failed') && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <p className="text-red-400 text-xs">
                                        {suite.tests.filter(t => t.status === 'failed').length} teste(s) falharam
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
