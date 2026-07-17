import React, { useState, useEffect } from 'react';
import { useAgentContacts, useAgentHistoryList } from '../../hooks/useAgents';
import { Upload, Plus, Trash2, RefreshCw, User, Phone as PhoneIcon, Mail, Building2, Briefcase, Loader, CheckCircle, Clock, AlertCircle, Download, FileText, History, MoveRight, CornerDownRight, CornerUpLeft, Play, Square, FilePlus2, X } from 'lucide-react';
import { CallHistoryModal } from './CallHistoryModal';

interface AgentContactsPanelProps {
    agentId: string;
    agentStatus?: 'idle' | 'calling' | 'paused' | 'disabled' | 'error' | 'scheduled';
    hasCredits?: boolean;
    scheduledAt?: string;
    onStart?: () => Promise<void>;
    onStop?: () => Promise<void>;
    onSchedule?: (dateTime: string) => Promise<void>;
    onCancelSchedule?: () => Promise<void>;
}

const AgentContactsPanel: React.FC<AgentContactsPanelProps> = ({ agentId, agentStatus, hasCredits = true, scheduledAt, onStart, onStop, onSchedule, onCancelSchedule }) => {
    const { contacts, loading, stats, addContacts, deleteContact, deleteAllContacts, resetContacts, importFromCSV, updateContactsStatus, getCallHistory } = useAgentContacts(agentId);
    const { historyList } = useAgentHistoryList(agentId);

    // Tab and selection states
    const [activeTab, setActiveTab] = useState<'pending' | 'dialed' | 'unanswered' | 'merge'>('pending');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectedHistoryContact, setSelectedHistoryContact] = useState<{ id: string, name: string } | null>(null);

    // Form states
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', company: '', sector: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isStopping, setIsStopping] = useState(false);

    // D&D states
    const [draggingOverTab, setDraggingOverTab] = useState<'pending' | 'dialed' | 'unanswered' | 'merge' | null>(null);

    // Derived lists - voicemail treated as failed
    const pendingContacts = contacts.filter(c => c.status === 'pending');
    const callingContacts = contacts.filter(c => c.status === 'calling');
    const dialedContacts = contacts.filter(c => c.status === 'completed' || c.status === 'skipped');
    const unansweredContacts = contacts.filter(c => c.status === 'no-answer' || c.status === 'voicemail' || c.status === 'failed');
    const mergeContacts = contacts.filter(c => c.status !== 'pending' && c.status !== 'calling');
    const currentList = activeTab === 'pending' ? [...pendingContacts, ...callingContacts]
        : activeTab === 'unanswered' ? unansweredContacts
            : activeTab === 'merge' ? mergeContacts
                : dialedContacts;

    const isAgentRunning = agentStatus === 'calling' || agentStatus === 'paused';

    // Fallback Polling: since Supabase Realtime might be disabled for contacts
    // Uses a dedicated event to avoid re-rendering the parent component/modal
    useEffect(() => {
        if (!isAgentRunning) {
            // Final refreshes when agent stops to capture last state
            const timer1 = setTimeout(() => { window.dispatchEvent(new Event('kito_refresh_contacts')); }, 800);
            const timer2 = setTimeout(() => { window.dispatchEvent(new Event('kito_refresh_contacts')); }, 2500);
            window.dispatchEvent(new Event('kito_refresh_agents')); // Update agent status in header
            return () => { clearTimeout(timer1); clearTimeout(timer2); };
        }

        const interval = setInterval(() => {
            // Refresh only contacts (not agents) to avoid unmounting parent
            window.dispatchEvent(new Event('kito_refresh_contacts'));
        }, 4000);
        return () => clearInterval(interval);
    }, [isAgentRunning]);

    const handleStartAgent = async () => {
        if (!onStart) return;
        setIsStarting(true);
        try {
            if (activeTab === 'merge' && mergeContacts.length > 0) {
                await updateContactsStatus(mergeContacts.map(c => c.id), 'pending');
            } else if (activeTab === 'unanswered' && unansweredContacts.length > 0) {
                await updateContactsStatus(unansweredContacts.map(c => c.id), 'pending');
            } else if (activeTab === 'dialed' && dialedContacts.length > 0) {
                await updateContactsStatus(dialedContacts.map(c => c.id), 'pending');
            }
            await onStart();
            // Refresh data without page reload
            window.dispatchEvent(new Event('kito_refresh_agents'));
        } catch (err: any) {
            alert(`Erro ao iniciar: ${err.message}`);
        } finally {
            setIsStarting(false);
        }
    };

    const handleStopAgent = async () => {
        if (!onStop) return;
        setIsStopping(true);
        try {
            await onStop();
        } catch (err: any) {
            alert(`Erro ao parar: ${err.message}`);
        } finally {
            setIsStopping(false);
        }
    };

    const handleNewList = async () => {
        if (!window.confirm('⚠️ NOVA LISTA: Isso vai APAGAR TODOS os contatos atuais (pendentes e histórico) e começar do zero.\n\nTem certeza?')) return;
        try {
            await deleteAllContacts();
            setActiveTab('pending');
            setSelectedIds(new Set());
        } catch (err: any) {
            alert(`Erro ao limpar lista: ${err.message}`);
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) return;

        setIsSubmitting(true);
        try {
            await addContacts([{
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                company: formData.company,
                sector: formData.sector
            }]);
            setFormData({ name: '', phone: '', email: '', company: '', sector: '' });
            setShowAddForm(false);
        } catch (err: any) {
            alert(`Erro ao adicionar contato: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const text = await file.text();
            const count = await importFromCSV(text);
            alert(`${count} contatos importados com sucesso!`);
        } catch (err: any) {
            alert(`Erro ao importar: ${err.message}`);
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };

    const downloadCsvTemplate = () => {
        const csvContent = "nome,telefone,email,empresa,setor\nJoão Silva,+5511999999999,joao@email.com,Empresa X,Vendas\nMaria Souza,+5511988888888,,,";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'modelo_importacao_kito.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === currentList.length && currentList.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(currentList.map(c => c.id)));
        }
    };

    const handleBulkMove = async (toTab: 'pending' | 'dialed' | 'unanswered' | 'merge') => {
        if (selectedIds.size === 0) return;
        try {
            const newStatus = toTab === 'pending' ? 'pending' : toTab === 'unanswered' ? 'no-answer' : 'skipped';
            await updateContactsStatus(Array.from(selectedIds), newStatus);
            setSelectedIds(new Set());
        } catch (err: any) {
            alert(`Erro ao mover contatos: ${err.message}`);
        }
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('contactId', id);
        if (!selectedIds.has(id)) {
            toggleSelection(id);
        }
    };

    const handleDragOver = (e: React.DragEvent, tab: 'pending' | 'dialed' | 'unanswered' | 'merge') => {
        e.preventDefault();
        if (tab !== activeTab) {
            setDraggingOverTab(tab);
        }
    };

    const handleDragLeave = (_e: React.DragEvent, tab: 'pending' | 'dialed' | 'unanswered' | 'merge') => {
        if (draggingOverTab === tab) {
            setDraggingOverTab(null);
        }
    };

    const handleDrop = async (e: React.DragEvent, toTab: 'pending' | 'dialed' | 'unanswered' | 'merge') => {
        e.preventDefault();
        setDraggingOverTab(null);

        if (toTab === activeTab) return;

        const draggedId = e.dataTransfer.getData('contactId');

        try {
            const newStatus = toTab === 'pending' ? 'pending' : toTab === 'unanswered' ? 'no-answer' : 'skipped';
            if (selectedIds.has(draggedId)) {
                await updateContactsStatus(Array.from(selectedIds), newStatus);
                setSelectedIds(new Set());
            } else {
                await updateContactsStatus([draggedId], newStatus);
            }
        } catch (err: any) {
            alert(`Erro ao mover contato: ${err.message}`);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-lg border border-yellow-500/20"><Clock className="w-3 h-3" /> Fila</span>;
            case 'calling': return <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-lg border border-blue-500/20"><Loader className="w-3 h-3 animate-spin" /> Em Ligação</span>;
            case 'completed': return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-lg border border-green-500/20"><CheckCircle className="w-3 h-3" /> Concluído</span>;
            case 'failed': return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-lg border border-red-500/20"><AlertCircle className="w-3 h-3" /> Falhou</span>;
            case 'voicemail': return <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/10 text-orange-400 text-xs rounded-lg border border-orange-500/20"><PhoneIcon className="w-3 h-3" /> Caixa Postal</span>;
            case 'no-answer': return <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/10 text-orange-400 text-xs rounded-lg border border-orange-500/20"><PhoneIcon className="w-3 h-3" /> Não Atendeu</span>;
            case 'skipped': return <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/10 text-gray-400 text-xs rounded-lg border border-gray-500/20"><MoveRight className="w-3 h-3" /> Pulado</span>;
            default: return <span className="text-gray-500 text-xs">{status}</span>;
        }
    };

    if (loading && contacts.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader className="w-8 h-8 animate-spin text-[#c4d82e]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* ═══════════ BARRA DE CONTROLE DO AGENTE ═══════════ */}
            <div className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-[#c4d82e]/5 to-white/5 p-4 rounded-2xl border border-[#c4d82e]/20">
                <div className="flex items-center gap-2 mr-auto">
                    <div className={`w-3 h-3 rounded-full ${isAgentRunning ? 'bg-green-500 animate-pulse' : agentStatus === 'scheduled' ? 'bg-orange-500 animate-pulse' : 'bg-gray-500'}`} />
                    <span className="text-sm font-bold text-white">
                        {agentStatus === 'calling' ? '🔥 Discando...' : agentStatus === 'paused' ? '⏸️ Pausado' : agentStatus === 'scheduled' ? `⏳ Agendado para ${new Date(scheduledAt || '').toLocaleString('pt-BR').slice(0, 16)}` : '⏹️ Parado'}
                    </span>
                    {pendingContacts.length > 0 && !isAgentRunning && (
                        <span className="text-xs text-gray-400 ml-2">({pendingContacts.length} na fila{callingContacts.length > 0 ? `, ${callingContacts.length} em curso` : ''})</span>
                    )}
                </div>

                {/* Botão CANCELAR AGENDAMENTO */}
                {agentStatus === 'scheduled' && onCancelSchedule && (
                    <button
                        onClick={onCancelSchedule}
                        className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold flex items-center gap-2 rounded-xl transition-all text-sm shadow-lg shadow-red-500/20"
                    >
                        <X className="w-4 h-4" /> Cancelar Agendamento
                    </button>
                )}

                {/* Botão INICIAR */}
                {!isAgentRunning && agentStatus !== 'scheduled' && onStart && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {onSchedule && (
                            <div className="bg-white/5 border border-white/10 rounded-xl flex items-center px-2 shadow-inner">
                                <input
                                    type="datetime-local"
                                    id={`scheduleTime-${agentId}`}
                                    className="px-2 py-2 bg-transparent text-sm text-white focus:outline-none focus:border-transparent calendar-picker-indicator-white"
                                />
                                <button
                                    onClick={() => {
                                        const val = (document.getElementById(`scheduleTime-${agentId}`) as HTMLInputElement)?.value;
                                        if (val) onSchedule(new Date(val).toISOString());
                                        else alert('Selecione uma data e hora válidas antes de agendar.');
                                    }}
                                    disabled={isStarting || !hasCredits || (
                                        activeTab === 'merge' ? mergeContacts.length === 0 :
                                            activeTab === 'unanswered' ? unansweredContacts.length === 0 :
                                                activeTab === 'dialed' ? dialedContacts.length === 0 :
                                                    pendingContacts.length === 0
                                    )}
                                    title="Agendar inicialização"
                                    className="px-3 py-1.5 ml-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-bold rounded-lg transition-all text-xs flex items-center gap-1 border border-orange-500/20"
                                >
                                    <Clock className="w-3 h-3" /> Agendar
                                </button>
                            </div>
                        )}
                        <button
                            onClick={handleStartAgent}
                            disabled={isStarting || !hasCredits || (
                                activeTab === 'merge' ? mergeContacts.length === 0 :
                                    activeTab === 'unanswered' ? unansweredContacts.length === 0 :
                                        activeTab === 'dialed' ? dialedContacts.length === 0 :
                                            pendingContacts.length === 0
                            )}
                            title={!hasCredits ? 'Agente sem créditos alocados!' : `Iniciar discagem para a aba atual`}
                            className="px-5 py-2.5 bg-[#c4d82e] hover:bg-[#b5c928] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold flex items-center gap-2 rounded-xl transition-all text-sm shadow-lg shadow-[#c4d82e]/20"
                        >
                            {activeTab === 'merge' ? 'Discar Mesclados' : activeTab === 'unanswered' ? 'Discar Não Atend.' : activeTab === 'dialed' ? 'Rediscar Todos' : 'Discar Fila'}
                        </button>
                    </div>
                )}

                {/* Botão PARAR */}
                {isAgentRunning && onStop && (
                    <button
                        onClick={handleStopAgent}
                        disabled={isStopping}
                        className="px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold flex items-center gap-2 rounded-xl transition-all text-sm shadow-lg shadow-red-500/20"
                    >
                        {isStopping ? <Loader className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                        Parar Ligações
                    </button>
                )}

                {/* Botão NOVA LISTA */}
                {agentStatus !== 'scheduled' && (
                    <button
                        onClick={handleNewList}
                        disabled={isAgentRunning}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-white font-bold flex items-center gap-2 rounded-xl transition-all text-sm"
                        title="Apagar todos os contatos e começar uma nova lista"
                    >
                        <FilePlus2 className="w-4 h-4 text-[#c4d82e]" /> Nova Lista
                    </button>
                )}
            </div>

            {/* ═══════════ RESUMO ═══════════ */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setActiveTab('pending')}>
                    <p className="text-xs text-gray-400">Fila</p>
                    <p className="text-xl font-bold text-yellow-400">{pendingContacts.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Em Curso</p>
                    <p className="text-xl font-bold text-blue-400">{stats.calling}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setActiveTab('dialed')}>
                    <p className="text-xs text-gray-400">Concluídas</p>
                    <p className="text-xl font-bold text-green-400">{stats.completed}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setActiveTab('unanswered')}>
                    <p className="text-xs text-gray-400">Não Atend.</p>
                    <p className="text-xl font-bold text-orange-400">{stats.unanswered}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setActiveTab('dialed')}>
                    <p className="text-xs text-gray-400">Pulados</p>
                    <p className="text-xl font-bold text-gray-400">{stats.skipped}</p>
                </div>
            </div>

            {/* ═══════════ AÇÕES DE IMPORTAÇÃO ═══════════ */}
            <div className="flex flex-wrap items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-[#c4d82e] hover:bg-[#b5c928] text-black font-bold flex items-center gap-2 rounded-xl transition-colors text-sm"
                >
                    <Plus className="w-4 h-4" /> Novo Manual
                </button>

                <div className="h-6 w-px bg-white/10 hidden md:block"></div>

                <label className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium flex items-center gap-2 rounded-xl transition-colors cursor-pointer text-sm">
                    {isImporting ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Importar CSV
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={isImporting} />
                </label>

                <button
                    onClick={downloadCsvTemplate}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-medium flex items-center gap-2 rounded-xl transition-colors text-sm"
                    title="Baixar planilha de exemplo"
                >
                    <Download className="w-4 h-4 text-[#c4d82e]" /> Modelo CSV
                </button>

                <div className="ml-auto w-full md:w-auto mt-2 md:mt-0 flex gap-2">
                    {activeTab === 'merge' && mergeContacts.length > 0 && (
                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={async () => {
                                    if (window.confirm('Deseja puxar todos os contatos inativos para a fila e JÁ INICIAR a discagem?')) {
                                        setIsStarting(true);
                                        try {
                                            await updateContactsStatus(mergeContacts.map(c => c.id), 'pending');
                                            if (onStart) {
                                                await onStart();
                                                window.dispatchEvent(new Event('kito_refresh_agents'));
                                            }
                                        } catch (err: any) {
                                            alert(`Erro ao iniciar: ${err.message}`);
                                        } finally {
                                            setIsStarting(false);
                                        }
                                    }
                                }}
                                disabled={isStarting || !hasCredits}
                                className="w-full md:w-auto justify-center px-4 py-2 bg-[#c4d82e] hover:bg-[#b5c928] disabled:opacity-50 text-black font-bold flex items-center gap-2 rounded-xl transition-colors text-sm"
                                title="Mesclar contatos para a fila e já iniciar a discagem"
                            >
                                {isStarting ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Mesclar e Discar
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm('Deseja apenas mesclar todos os contatos inativos de volta para a fila pendente?')) {
                                        updateContactsStatus(mergeContacts.map(c => c.id), 'pending');
                                    }
                                }}
                                className="w-full md:w-auto justify-center px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 font-medium flex items-center gap-2 rounded-xl transition-colors text-sm"
                                title="Apenas jogar tudo de volta na Fila"
                            >
                                <RefreshCw className="w-4 h-4" /> Apenas Mesclar
                            </button>
                        </div>
                    )}
                    {activeTab === 'unanswered' && unansweredContacts.length > 0 && (
                        <button
                            onClick={() => {
                                if (window.confirm('Deseja mesclar todos os contatos NÃO ATENDIDOS de volta para a fila?')) {
                                    updateContactsStatus(unansweredContacts.map(c => c.id), 'pending');
                                }
                            }}
                            className="w-full md:w-auto justify-center px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 font-medium flex items-center gap-2 rounded-xl transition-colors text-sm"
                            title="Tentar ligar novamente para os não atendidos"
                        >
                            <RefreshCw className="w-4 h-4" /> Reciclar Não Atend.
                        </button>
                    )}
                    {activeTab === 'dialed' && dialedContacts.length > 0 && (
                        <button
                            onClick={resetContacts}
                            className="w-full md:w-auto justify-center px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 font-medium flex items-center gap-2 rounded-xl transition-colors text-sm"
                            title="Colocar TODOS os finalizados novamente na Fila"
                        >
                            <RefreshCw className="w-4 h-4" /> Restaurar Histórico
                        </button>
                    )}
                </div>
            </div>

            {/* ═══════════ FORMULÁRIO DE ADIÇÃO ═══════════ */}
            {showAddForm && (
                <form onSubmit={handleAddSubmit} className="bg-white/5 border border-white/10 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Nome *</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#c4d82e] outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1"><PhoneIcon className="w-3 h-3" /> Telefone *</label>
                        <input type="text" required placeholder="+5511999999999" value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#c4d82e] outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
                        <input type="email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#c4d82e] outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Empresa</label>
                        <input type="text" value={formData.company} onChange={e => setFormData(f => ({ ...f, company: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#c4d82e] outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Setor</label>
                        <input type="text" value={formData.sector} onChange={e => setFormData(f => ({ ...f, sector: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#c4d82e] outline-none" />
                    </div>
                    <div className="flex items-end">
                        <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-[#c4d82e] hover:bg-[#b5c928] text-black font-bold rounded-lg transition-colors flex justify-center items-center gap-2 text-sm">
                            {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Salvar Contato'}
                        </button>
                    </div>
                </form>
            )}

            {/* ═══════════ CONTROLE DE ABAS + BULK ACTIONS ═══════════ */}
            <div className="flex justify-between items-end mt-6 border-b border-white/10">
                <div className="flex gap-2 relative top-[1px]">
                    <button
                        onClick={() => { setActiveTab('pending'); setSelectedIds(new Set()); }}
                        onDragOver={(e) => handleDragOver(e, 'pending')}
                        onDragLeave={(e) => handleDragLeave(e, 'pending')}
                        onDrop={(e) => handleDrop(e, 'pending')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all border-b-2 ${activeTab === 'pending'
                            ? 'bg-white/10 border-[#c4d82e] text-white'
                            : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            } ${draggingOverTab === 'pending' ? 'bg-[#c4d82e]/20 border-[#c4d82e] scale-105 shadow-lg shadow-[#c4d82e]/20' : ''}`}
                    >
                        <FileText className="w-4 h-4" />
                        Fila Pendente ({pendingContacts.length}{callingContacts.length > 0 ? ` + ${callingContacts.length}⚡` : ''})
                    </button>

                    <button
                        onClick={() => { setActiveTab('dialed'); setSelectedIds(new Set()); }}
                        onDragOver={(e) => handleDragOver(e, 'dialed')}
                        onDragLeave={(e) => handleDragLeave(e, 'dialed')}
                        onDrop={(e) => handleDrop(e, 'dialed')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all border-b-2 ${activeTab === 'dialed'
                            ? 'bg-white/10 border-[#c4d82e] text-white'
                            : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            } ${draggingOverTab === 'dialed' ? 'bg-[#c4d82e]/20 border-[#c4d82e] scale-105 shadow-lg shadow-[#c4d82e]/20' : ''}`}
                    >
                        <History className="w-4 h-4" />
                        Histórico / Discados ({historyList?.length || 0})
                    </button>

                    <button
                        onClick={() => { setActiveTab('unanswered'); setSelectedIds(new Set()); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all border-b-2 ${activeTab === 'unanswered'
                            ? 'bg-orange-500/10 border-orange-500 text-white'
                            : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                    >
                        <PhoneIcon className="w-4 h-4" />
                        Não Atendidos ({unansweredContacts.length})
                    </button>

                    <button
                        onClick={() => { setActiveTab('merge'); setSelectedIds(new Set()); }}
                        onDragOver={(e) => handleDragOver(e, 'merge')}
                        onDragLeave={(e) => handleDragLeave(e, 'merge')}
                        onDrop={(e) => handleDrop(e, 'merge')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all border-b-2 ${activeTab === 'merge'
                            ? 'bg-blue-500/10 border-blue-500 text-white'
                            : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            } ${draggingOverTab === 'merge' ? 'bg-blue-500/20 border-blue-500 scale-105 shadow-lg shadow-blue-500/20' : ''}`}
                    >
                        <RefreshCw className="w-4 h-4" />
                        Mesclar Lista ({mergeContacts.length})
                    </button>
                </div>

                {/* Bulk actions */}
                {selectedIds.size > 0 && (
                    <div className="flex items-center gap-3 bg-[#c4d82e]/10 border border-[#c4d82e]/30 p-2 rounded-t-xl mb-[1px]">
                        <span className="text-[#c4d82e] text-sm font-bold pl-2">
                            {selectedIds.size} selecionados
                        </span>

                        {activeTab === 'pending' ? (
                            <>
                                <button
                                    onClick={() => handleBulkMove('dialed')}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-500/20 hover:bg-gray-500/40 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <CornerDownRight className="w-3 h-3" /> Mover para Histórico
                                </button>
                                <button
                                    onClick={() => handleBulkMove('unanswered')}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <CornerDownRight className="w-3 h-3" /> Mover para Não Atendidos
                                </button>
                            </>
                        ) : activeTab === 'merge' && selectedIds.size > 0 ? (
                            <button
                                onClick={() => handleBulkMove('pending')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[#c4d82e]/20 hover:bg-[#c4d82e]/40 text-[#c4d82e] rounded-lg text-sm font-medium transition-colors"
                            >
                                <CornerUpLeft className="w-3 h-3" /> Mesclar Selecionados na Fila
                            </button>
                        ) : (
                            <button
                                onClick={() => handleBulkMove('pending')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[#c4d82e]/20 hover:bg-[#c4d82e]/40 text-[#c4d82e] rounded-lg text-sm font-medium transition-colors"
                            >
                                <CornerUpLeft className="w-3 h-3" /> Voltar para Fila
                            </button>
                        )}
                        <button
                            onClick={async () => {
                                if (window.confirm(`Deletar ${selectedIds.size} contatos?`)) {
                                    for (const id of Array.from(selectedIds)) {
                                        await deleteContact(id);
                                    }
                                    setSelectedIds(new Set());
                                }
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Trash2 className="w-3 h-3" /> Deletar
                        </button>
                    </div>
                )}
            </div>

            {/* ═══════════ TABELA DE CONTATOS ═══════════ */}
            {activeTab === 'dialed' ? (
                historyList.length === 0 ? (
                    <div className="text-center py-16 bg-white/5 border border-white/10 rounded-b-2xl rounded-tr-2xl border-t-0 p-8">
                        <History className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <h3 className="text-xl text-white font-medium">Nenhum evento no histórico</h3>
                        <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto">As ligações efetuadas aparecerão aqui de forma cronológica, puxadas da base de dados do Agente.</p>
                    </div>
                ) : (
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-b-2xl rounded-tr-2xl overflow-hidden border-t-0">
                        <div className="bg-[#252525] px-4 py-2 flex items-center justify-between border-b border-white/5">
                            <p className="text-xs text-gray-400 italic">💡 Histórico oficial e cronológico de todas as ligações deste agente no Supabase</p>
                        </div>
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full text-left text-sm text-gray-400 relative">
                                <thead className="text-xs uppercase bg-[#1e1e1e] text-gray-300 sticky top-0 z-10 shadow-md">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Data / Hora</th>
                                        <th className="px-4 py-3 font-medium">Contato</th>
                                        <th className="px-4 py-3 font-medium">Status / Custo</th>
                                        <th className="px-4 py-3 font-medium text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {historyList.map((h: any) => {
                                        const c = contacts.find(contact => contact.id === h.contact_id);
                                        return (
                                            <tr key={h.id} className="hover:bg-white/[0.07] transition-colors group">
                                                <td className="px-4 py-3 text-xs">
                                                    {new Date(h.started_at).toLocaleString('pt-BR')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-gray-300 group-hover:text-white transition-colors">{c?.name || 'Contato Excluído'}</p>
                                                    <p className="text-xs font-mono text-gray-500">{c?.phone || 'N/A'}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col items-start gap-1">
                                                        {getStatusBadge(h.status)}
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {h.duration_seconds !== null && (
                                                                <span className="text-[10px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded">
                                                                    ⏱️ {h.duration_seconds || 0}s
                                                                </span>
                                                            )}
                                                            {h.credits_used > 0 && (
                                                                <span className="text-[10px] text-yellow-500 font-medium">
                                                                    🪙 {h.credits_used.toFixed(2)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity">
                                                        {h.contact_id && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedHistoryContact({ id: h.contact_id, name: c?.name || '' }); }}
                                                                className="p-2 text-gray-400 hover:text-blue-400 transition-colors bg-white/5 hover:bg-white/10 rounded-lg"
                                                                title="Ver Detalhes do Histórico"
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {h.contact_id && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); updateContactsStatus([h.contact_id], 'pending'); }}
                                                                className="p-2 text-gray-400 hover:text-[#c4d82e] transition-colors bg-white/5 hover:bg-white/10 rounded-lg"
                                                                title="Rediscar (Voltar para Fila Pendente)"
                                                            >
                                                                <RefreshCw className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            ) : currentList.length === 0 ? (
                <div className="text-center py-16 bg-white/5 border border-white/10 rounded-b-2xl rounded-tr-2xl border-t-0 p-8">
                    <History className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-xl text-white font-medium">
                        {activeTab === 'pending' ? 'Nenhum contato na fila' : activeTab === 'unanswered' ? 'Nenhum contato falhou ou deixou de atender' : activeTab === 'merge' ? 'Nada para mesclar' : 'Nenhum contato no histórico'}
                    </h3>
                    <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto">
                        {activeTab === 'pending'
                            ? 'Adicione nomes usando o botão "Novo Manual" ou importe sua planilha Excel/CSV para começar.'
                            : activeTab === 'unanswered'
                                ? 'Os contatos que não atenderam, deram caixa postal ou número ocupado vão aparecer aqui.'
                                : activeTab === 'merge'
                                    ? 'Selecione e mescle contatos inativos de volta para a fila pendente.'
                                    : 'Os contatos que finalizarem a ligação ou falharem aparecerão nesta aba.'}
                    </p>
                </div>
            ) : (
                <div className="bg-[#1a1a1a] border border-white/10 rounded-b-2xl rounded-tr-2xl overflow-hidden border-t-0">
                    <div className="bg-[#252525] px-4 py-2 flex items-center justify-between border-b border-white/5">
                        <p className="text-xs text-gray-400 italic">
                            💡 Arraste contatos para as abas acima ou selecione vários usando os checkboxes
                        </p>
                    </div>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left text-sm text-gray-400 relative">
                            <thead className="text-xs uppercase bg-[#1e1e1e] text-gray-300 sticky top-0 z-10 shadow-md">
                                <tr>
                                    <th className="px-4 py-3 font-medium w-12 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.size === currentList.length && currentList.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded appearance-none border border-gray-500 bg-gray-700 checked:bg-[#c4d82e] checked:border-[#c4d82e] transition-colors cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-4 py-3 font-medium">Nome / Fone</th>
                                    <th className="px-4 py-3 font-medium">Detalhes</th>
                                    <th className="px-4 py-3 font-medium">Status / Duração</th>
                                    <th className="px-4 py-3 font-medium text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {currentList.map((contact) => (
                                    <tr
                                        key={contact.id}
                                        draggable="true"
                                        onDragStart={(e) => handleDragStart(e, contact.id)}
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
                                            toggleSelection(contact.id);
                                        }}
                                        className={`hover:bg-white/[0.07] transition-colors cursor-grab active:cursor-grabbing group ${selectedIds.has(contact.id) ? 'bg-[#c4d82e]/5 border-l-2 border-l-[#c4d82e]' : 'border-l-2 border-l-transparent'
                                            }`}
                                    >
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(contact.id)}
                                                onChange={() => toggleSelection(contact.id)}
                                                className="w-4 h-4 rounded appearance-none border border-gray-500 bg-gray-700 checked:bg-[#c4d82e] checked:border-[#c4d82e] transition-colors cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className={`font-medium ${selectedIds.has(contact.id) ? 'text-white' : 'text-gray-300'} group-hover:text-white transition-colors`}>{contact.name}</p>
                                            <p className="text-xs font-mono text-gray-500">{contact.phone}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {contact.company && <p className="text-xs text-gray-400 group-hover:text-gray-300"><Building2 className="w-3 h-3 inline mr-1 opacity-50" />{contact.company}</p>}
                                            {contact.sector && <p className="text-xs text-gray-400 group-hover:text-gray-300"><Briefcase className="w-3 h-3 inline mr-1 opacity-50" />{contact.sector}</p>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col items-start gap-1">
                                                {getStatusBadge(contact.status)}
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {contact.attempt_count > 0 && <span className="text-[10px] text-gray-500">Tentativas: {contact.attempt_count}</span>}
                                                    {contact.last_call_duration !== undefined && contact.last_call_duration > 0 && (
                                                        <span className="text-[10px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded ml-1">
                                                            ⏱️ {contact.last_call_duration}s
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                {contact.status !== 'pending' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedHistoryContact({ id: contact.id, name: contact.name }); }}
                                                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors bg-white/5 hover:bg-white/10 rounded-lg"
                                                        title="Ver Histórico (Transcrição/Áudio)"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteContact(contact.id); }}
                                                    className="p-2 text-gray-500 hover:text-red-400 transition-colors bg-white/5 hover:bg-white/10 rounded-lg"
                                                    title="Deletar Contato"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedHistoryContact && (
                <CallHistoryModal
                    contactId={selectedHistoryContact.id}
                    contactName={selectedHistoryContact.name}
                    onClose={() => setSelectedHistoryContact(null)}
                    getCallHistory={getCallHistory}
                />
            )}
        </div>
    );
};

export default AgentContactsPanel;
