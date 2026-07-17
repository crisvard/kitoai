import { useEffect, useState } from 'react';
import { X, Clock, FileText, AlignLeft, Headphones, Loader, AlertCircle } from 'lucide-react';

interface CallHistoryModalProps {
    contactId: string;
    contactName?: string;
    onClose: () => void;
    getCallHistory: (id: string) => Promise<any>;
}

export function CallHistoryModal({ contactId, contactName, onClose, getCallHistory }: CallHistoryModalProps) {
    const [history, setHistory] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCallHistory(contactId).then(data => {
            setHistory(data);
            setLoading(false);
        });
    }, [contactId, getCallHistory]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#c4d82e]" />
                            Histórico de Chamada
                        </h2>
                        {contactName && <p className="text-sm text-gray-400 mt-1">Contato: {contactName}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Loader className="w-8 h-8 animate-spin text-[#c4d82e] mb-4" />
                            <p>Carregando histórico...</p>
                        </div>
                    ) : !history ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white/5 rounded-xl border border-white/10">
                            <AlertCircle className="w-8 h-8 opacity-50 mb-4" />
                            <p>Nenhum registro de chamada encontrado para este contato.</p>
                            <p className="text-xs opacity-50 mt-2">Isto pode acontecer se a ligação falhou antes de conectar na VAPI.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                    <p className="text-xs text-gray-500 mb-1">Status</p>
                                    <p className="font-semibold text-white capitalize">{history.status}</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                    <p className="text-xs text-gray-500 mb-1">Duração</p>
                                    <p className="font-semibold text-white flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-[#c4d82e]" />
                                        {history.duration_seconds || 0}s
                                    </p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                    <p className="text-xs text-gray-500 mb-1">Créditos Usados</p>
                                    <p className="font-semibold text-white">{history.credits_used || 0}</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                    <p className="text-xs text-gray-500 mb-1">Data</p>
                                    <p className="font-semibold text-white text-sm">
                                        {new Date(history.started_at).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </div>

                            {/* Resumo IA */}
                            {history.summary && (
                                <div className="bg-[#c4d82e]/5 border border-[#c4d82e]/20 rounded-xl p-4">
                                    <h3 className="text-sm font-bold text-[#c4d82e] flex items-center gap-2 mb-2">
                                        <AlignLeft className="w-4 h-4" />
                                        Resumo da IA
                                    </h3>
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        {history.summary}
                                    </p>
                                </div>
                            )}

                            {/* Gravação */}
                            {history.recording_url && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                                        <Headphones className="w-4 h-4 text-blue-400" />
                                        Gravação de Áudio
                                    </h3>
                                    <audio controls className="w-full h-10 custom-audio-player">
                                        <source src={history.recording_url} type="audio/wav" />
                                        Seu navegador não suporta o elemento de áudio.
                                    </audio>
                                </div>
                            )}

                            {/* Transcrição */}
                            {history.transcript && (
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        Transcrição Completa
                                    </h3>
                                    <div className="bg-[#111] border border-white/10 rounded-xl p-4 whitespace-pre-wrap text-sm text-gray-400 font-mono leading-relaxed h-[200px] overflow-y-auto custom-scrollbar italic">
                                        {history.transcript}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-6 mt-2 border-t border-white/10 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
