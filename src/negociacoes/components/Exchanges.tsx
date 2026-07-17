import { useState } from 'react';
import { Plus, CheckCircle, XCircle, Settings, Trash2, AlertCircle, Info, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { EXCHANGE_LIST } from '../config/exchanges';
import { useExchanges } from '../hooks/useExchanges';
import { getExchangeHelp } from '../config/exchangeHelp';

export default function Exchanges() {
  const { exchanges, loading, error, addExchange, removeExchange, testConnection, refreshExchanges } = useExchanges();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState('');
  const [formData, setFormData] = useState({ apiKey: '', apiSecret: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedExchange('');
    setFormData({ apiKey: '', apiSecret: '' });
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleTestConnection = async () => {
    if (!selectedExchange || !formData.apiKey || !formData.apiSecret) {
      setSubmitError('Preencha todos os campos antes de testar');
      return;
    }

    try {
      setIsTesting(true);
      setSubmitError(null);
      
      await testConnection(selectedExchange, formData.apiKey, formData.apiSecret);
      
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao testar conexão');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedExchange || !formData.apiKey || !formData.apiSecret) {
      setSubmitError('Preencha todos os campos');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await addExchange(selectedExchange, formData.apiKey, formData.apiSecret);
      
      handleCloseModal();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao adicionar exchange');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover a conexão com ${name}?`)) {
      return;
    }

    try {
      await removeExchange(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover exchange');
    }
  };

  const handleSync = async () => {
    try {
      await refreshExchanges();
    } catch (err) {
      alert('Erro ao sincronizar exchanges');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Exchanges</h2>
          <p className="text-gray-400">Gerencie suas exchanges conectadas</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#c4d82e] hover:bg-[#b5c928] text-black rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-[#c4d82e]/50"
        >
          <Plus size={20} />
          Adicionar Exchange
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-400" size={18} />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#c4d82e] animate-spin" />
        </div>
      ) : exchanges.length === 0 ? (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
          <div className="w-16 h-16 bg-[#c4d82e]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-[#c4d82e]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Nenhuma exchange conectada</h3>
          <p className="text-gray-400 mb-6">
            Conecte suas exchanges para começar a gerenciar seus investimentos
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-[#c4d82e] hover:bg-[#b5c928] text-black rounded-xl font-semibold transition-all duration-200"
          >
            Conectar primeira exchange
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exchanges.map((exchange) => (
            <div
              key={exchange.id}
              className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-[#c4d82e]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#c4d82e]/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{exchange.name}</h3>
                  <div className="flex items-center gap-2">
                    {exchange.is_active ? (
                      <>
                        <CheckCircle size={16} className="text-green-400" />
                        <span className="text-green-400 text-sm">Ativa</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={16} className="text-red-400" />
                        <span className="text-red-400 text-sm">Inativa</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleSync}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    title="Sincronizar"
                  >
                    <RefreshCw size={18} className="text-gray-400 hover:text-white" />
                  </button>
                  <button
                    onClick={() => handleRemove(exchange.id, exchange.name)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    title="Remover"
                  >
                    <Trash2 size={18} className="text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">API Key</span>
                  <span className="text-white font-mono text-xs">
                    {exchange.api_key ? `${exchange.api_key.substring(0, 8)}...` : 'Não configurada'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Conectada em</span>
                  <span className="text-gray-400 text-sm">
                    {new Date(exchange.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <button 
                onClick={handleSync}
                className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Sincronizar Agora
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-white/10 to-white/[0.05] backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full mx-4 border border-white/20 animate-slideUp max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Adicionar Exchange</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {EXCHANGE_LIST.map((exchange) => (
                <button
                  key={exchange.id}
                  onClick={() => setSelectedExchange(exchange.name)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedExchange === exchange.name
                      ? 'border-[#c4d82e] bg-[#c4d82e]/10'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{exchange.logo}</span>
                    <span className="text-white font-semibold text-lg">{exchange.displayName}</span>
                  </div>
                  <p className="text-gray-400 text-sm">{exchange.description}</p>
                </button>
              ))}
            </div>

            {selectedExchange && (
              <div className="space-y-4 mb-6 animate-fadeIn">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex gap-3">
                    <Info className="text-[#c4d82e] flex-shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[#c4d82e] font-medium text-sm">
                          Como obter suas credenciais na {selectedExchange}:
                        </p>
                        {getExchangeHelp(selectedExchange)?.docs && (
                          <a
                            href={getExchangeHelp(selectedExchange)!.docs}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#c4d82e] text-xs hover:underline flex items-center gap-1"
                          >
                            Documentação
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <ol className="text-gray-300 text-xs space-y-1 list-decimal list-inside">
                        {getExchangeHelp(selectedExchange)?.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        )) || (
                          <>
                            <li>Acesse a plataforma {selectedExchange}</li>
                            <li>Vá para Configurações → Segurança → API</li>
                            <li>Crie uma nova API key com permissões: Read + Trade</li>
                            <li>Cole a chave e secret abaixo</li>
                          </>
                        )}
                      </ol>
                      {getExchangeHelp(selectedExchange)?.permissions && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-gray-400 text-xs mb-2 font-medium">Permissões necessárias:</p>
                          <div className="space-y-1">
                            {getExchangeHelp(selectedExchange)!.permissions.map((perm, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                {perm.required ? (
                                  <CheckCircle size={14} className="text-green-400" />
                                ) : (
                                  <XCircle size={14} className="text-red-400" />
                                )}
                                <span className={perm.required ? 'text-green-400' : 'text-red-400'}>
                                  {perm.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-2 text-sm font-medium">
                    API Key <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Cole sua API key aqui"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c4d82e] transition-colors font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2 text-sm font-medium">
                    API Secret <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.apiSecret}
                    onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                    placeholder="Cole sua API secret aqui"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c4d82e] transition-colors font-mono text-sm"
                  />
                </div>

                {submitError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="text-red-400 flex-shrink-0" size={18} />
                      <p className="text-red-400 text-sm">{submitError}</p>
                    </div>
                  </div>
                )}

                {submitSuccess && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-green-400 flex-shrink-0" size={18} />
                      <p className="text-green-400 text-sm">Conexão testada com sucesso!</p>
                    </div>
                  </div>
                )}

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex gap-2">
                    <AlertCircle className="text-amber-400 flex-shrink-0" size={18} />
                    <p className="text-amber-400 text-xs">
                      <strong>Segurança:</strong> Suas credenciais são criptografadas e armazenadas com segurança. 
                      Nunca compartilhe sua API Secret e use apenas permissões de leitura e negociação (não saque).
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleTestConnection}
                  disabled={isTesting || !formData.apiKey || !formData.apiSecret}
                  className="w-full py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testando conexão...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Testar Conexão
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-white/10">
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedExchange || !formData.apiKey || !formData.apiSecret || isSubmitting}
                className="flex-1 py-3 bg-[#c4d82e] hover:bg-[#b5c928] text-black rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  'Conectar Exchange'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
