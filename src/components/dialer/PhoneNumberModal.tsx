import React, { useState } from 'react';
import { X, Phone, Plus, Trash2, Loader, CheckCircle, ExternalLink, UserCheck, ShoppingCart, RefreshCw, Download } from 'lucide-react';
import { usePhoneNumbers, VapiPhoneNumber } from '../../hooks/usePhoneNumbers';


interface PhoneNumberModalProps {
  onClose: () => void;
}

type AddMode = 'twilio' | 'import_vapi' | 'buy_vapi' | 'import_twilio' | 'manual' | null;

const PhoneNumberModal: React.FC<PhoneNumberModalProps> = ({ onClose }) => {
  const { phoneNumbers, loading, addTwilioNumber, addManualNumber, deletePhoneNumber, buyVapiNumber, fetchVapiNumbers, importVapiNumber, fetchTwilioNumbers } = usePhoneNumbers();
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form: Twilio (só número + apelido — credenciais são do servidor)
  const [twilioForm, setTwilioForm] = useState({ phone_number: '', nickname: '' });

  // Form: Comprar número VAPI (provisionamento direto)
  const [buyForm, setBuyForm] = useState({ area_code: '', country_code: 'US', nickname: '' });

  // Form: Adição Manual
  const [manualForm, setManualForm] = useState({ phone_number: '', nickname: '' });

  // Import: lista de números buscados da conta VAPI
  const [vapiNumbers, setVapiNumbers] = useState<VapiPhoneNumber[]>([]);
  const [vapiLoading, setVapiLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  // Import: lista de números buscados da conta Twilio
  const [twilioNumbers, setTwilioNumbers] = useState<VapiPhoneNumber[]>([]);
  const [twilioLoading, setTwilioLoading] = useState(false);


  const handleAddTwilio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addTwilioNumber(twilioForm);
      setTwilioForm({ phone_number: '', nickname: '' });
      setAddMode(null);
    } catch (error: any) {
      alert(`Erro ao adicionar número: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addManualNumber(manualForm);
      setManualForm({ phone_number: '', nickname: '' });
      setAddMode(null);
    } catch (error: any) {
      alert(`Erro ao adicionar número manual: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenImportVapi = async () => {
    setAddMode('import_vapi');
    setVapiNumbers([]);
    setVapiLoading(true);
    try {
      const list = await fetchVapiNumbers();
      setVapiNumbers(list);
    } catch (error: any) {
      alert(`Erro ao buscar números da VAPI: ${error.message}`);
    } finally {
      setVapiLoading(false);
    }
  };

  const handleOpenImportTwilio = async () => {
    setAddMode('import_twilio');
    setTwilioNumbers([]);
    setTwilioLoading(true);
    try {
      const list = await fetchTwilioNumbers();
      setTwilioNumbers(list);
    } catch (error: any) {
      alert(`Erro ao buscar números da Twilio: ${error.message}`);
    } finally {
      setTwilioLoading(false);
    }
  };


  const handleImportNumber = async (vapiNum: VapiPhoneNumber) => {
    setImportingId(vapiNum.id);
    try {
      await importVapiNumber(vapiNum);
      // Marca como importado localmente sem refetch
      setVapiNumbers(prev => prev.map(n => n.id === vapiNum.id ? { ...n, already_imported: true } : n));
    } catch (error: any) {
      alert(`Erro ao importar número: ${error.message}`);
    } finally {
      setImportingId(null);
    }
  };

  const handleImportTwilioNumber = async (twilioNum: VapiPhoneNumber) => {
    setImportingId(twilioNum.id);
    try {
      await addTwilioNumber({ phone_number: twilioNum.number, nickname: twilioNum.name || undefined });
      setTwilioNumbers(prev => prev.map(n => n.id === twilioNum.id ? { ...n, already_imported: true } : n));
    } catch (error: any) {
      alert(`Erro ao importar número da Twilio: ${error.message}`);
    } finally {
      setImportingId(null);
    }
  };

  const handleBuyVapi = async () => {
    setSaving(true);
    try {
      const result = await buyVapiNumber({
        area_code: buyForm.area_code || undefined,
        country_code: buyForm.country_code || 'US',
        nickname: buyForm.nickname || undefined,
      });
      setBuyForm({ area_code: '', country_code: 'US', nickname: '' });
      setAddMode(null);
      alert(`Número ${result.phone_number} provisionado com sucesso!`);
    } catch (error: any) {
      alert(`Erro ao provisionar número: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, phoneNum: string) => {
    if (!window.confirm(`Remover ${phoneNum} da sua conta?`)) return;
    setDeletingId(id);
    try {
      await deletePhoneNumber(id);
    } catch (error: any) {
      alert(`Erro ao remover número: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const providerBadge = (provider: string) => {
    const map: Record<string, string> = {
      twilio: 'bg-red-500/20 text-red-300',
      vonage: 'bg-purple-500/20 text-purple-300',
      vapi: 'bg-[#c4d82e]/20 text-[#c4d82e]',
      manual: 'bg-blue-500/20 text-blue-300',
    };
    return map[provider] ?? 'bg-gray-500/20 text-gray-300';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#2a2a2a] to-[#252525] border-b border-white/10 p-6 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Phone className="w-6 h-6 text-[#c4d82e]" />
              Números de Telefone
            </h2>
            <p className="text-sm text-gray-400 mt-1">Gerencie os números usados pelos seus agentes</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Info box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
            <p className="text-sm text-blue-300">
              Cada agente precisa de um número de telefone para fazer ligações outbound.
              As credenciais Twilio já estão configuradas no servidor — você só precisa informar o número.
            </p>
          </div>

          {/* Lista de números cadastrados */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Seus Números</h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-[#c4d82e] animate-spin" />
              </div>
            ) : phoneNumbers.length === 0 ? (
              <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 text-center">
                <Phone className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Nenhum número cadastrado ainda.</p>
                <p className="text-sm text-gray-500 mt-1">Adicione um número abaixo para começar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {phoneNumbers.map(pn => (
                  <div
                    key={pn.id}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#c4d82e]/10 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-[#c4d82e]" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{pn.phone_number}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {pn.nickname && <span className="text-xs text-gray-400">{pn.nickname}</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${providerBadge(pn.provider)}`}>
                            {pn.provider}
                          </span>
                          {pn.usedByAgentName ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              {pn.usedByAgentName}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">Disponível</span>
                          )}
                          <span className="text-xs text-gray-500 font-mono truncate max-w-[120px]" title={pn.vapi_phone_number_id}>
                            ID: {pn.vapi_phone_number_id.slice(0, 12)}…
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(pn.id, pn.phone_number)}
                      disabled={deletingId === pn.id || !!pn.usedByAgentName}
                      title={pn.usedByAgentName ? `Em uso por ${pn.usedByAgentName}` : 'Remover'}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {deletingId === pn.id ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões de adicionar */}
          {!addMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => setAddMode('buy_vapi')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#c4d82e]/10 hover:bg-[#c4d82e]/20 border border-[#c4d82e]/30 text-[#c4d82e] rounded-2xl font-semibold transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                Comprar VAPI
              </button>
              <button
                onClick={handleOpenImportVapi}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-2xl font-semibold transition-all"
              >
                <Download className="w-4 h-4" />
                Buscar da VAPI
              </button>
              <button
                onClick={handleOpenImportTwilio}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 rounded-2xl font-semibold transition-all"
              >
                <Download className="w-4 h-4" />
                Buscar da Twilio
              </button>
              <button
                onClick={() => setAddMode('manual')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 rounded-2xl font-semibold transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Digitar Manual
              </button>
              <button
                onClick={() => setAddMode('twilio')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-500 rounded-2xl font-semibold transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Twilio (Digitar)
              </button>
            </div>
          )}

          {/* Form: Twilio (sem credenciais — usam secrets do servidor) */}
          {addMode === 'twilio' && (
            <form onSubmit={handleAddTwilio} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">Adicionar Número Twilio</h4>
                <button type="button" onClick={() => setAddMode(null)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                <p className="text-xs text-green-300">
                  ✓ Credenciais Twilio configuradas no servidor. Informe apenas o número.
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Número (formato E.164) *</label>
                <input
                  type="text"
                  placeholder="+5511999998888"
                  value={twilioForm.phone_number}
                  onChange={e => setTwilioForm(f => ({ ...f, phone_number: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Apelido (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Número Principal SP"
                  value={twilioForm.nickname}
                  onChange={e => setTwilioForm(f => ({ ...f, nickname: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddMode(null)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {saving ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </form>
          )}

          {/* Form: Comprar número VAPI (provisionamento direto) */}
          {addMode === 'buy_vapi' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#c4d82e]" />
                  Provisionar Número via VAPI
                </h4>
                <button type="button" onClick={() => setAddMode(null)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                <p className="text-xs text-yellow-300">
                  ⚡ O número será provisionado automaticamente pela VAPI e cobrado na sua conta VAPI (billing configurado no dashboard).
                  Informe o país e opcionalmente o DDD desejado.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">País *</label>
                  <select
                    value={buyForm.country_code}
                    onChange={e => setBuyForm(f => ({ ...f, country_code: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                  >
                    <option value="US" className="bg-[#2a2a2a]">🇺🇸 EUA (US)</option>
                    <option value="CA" className="bg-[#2a2a2a]">🇨🇦 Canadá (CA)</option>
                    <option value="GB" className="bg-[#2a2a2a]">🇬🇧 Reino Unido (GB)</option>
                    <option value="AU" className="bg-[#2a2a2a]">🇦🇺 Austrália (AU)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Código de Área (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: 415, 212"
                    value={buyForm.area_code}
                    onChange={e => setBuyForm(f => ({ ...f, area_code: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Apelido (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Número de Vendas"
                  value={buyForm.nickname}
                  onChange={e => setBuyForm(f => ({ ...f, nickname: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-xs text-blue-300">
                  💡 Para usar números brasileiros (+55), utilize a opção <strong>Adicionar via Twilio</strong> com seu Account SID Twilio (começa com <code className="bg-white/10 px-1 rounded">AC</code>).
                  VAPI provisiona números nos EUA, Reino Unido, Canadá e Austrália diretamente.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddMode(null)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleBuyVapi}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-[#c4d82e] hover:bg-[#b5c928] text-black rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                  {saving ? 'Provisionando...' : 'Provisionar Número'}
                </button>
              </div>
            </div>
          )}

          {/* Painel: Importar número existente da conta VAPI */}
          {addMode === 'import_vapi' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#c4d82e]" />
                  Números na sua conta VAPI
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenImportVapi}
                    disabled={vapiLoading}
                    title="Atualizar lista"
                    className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${vapiLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button type="button" onClick={() => setAddMode(null)} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-xs text-blue-300">
                  Estes são todos os números cadastrados na sua conta VAPI. Clique em <strong>Importar</strong> para ativá-los no sistema.
                  Números já importados ficam marcados automaticamente.
                </p>
              </div>

              {vapiLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader className="w-6 h-6 text-[#c4d82e] animate-spin" />
                  <span className="text-sm text-gray-400">Buscando números da sua conta VAPI...</span>
                </div>
              ) : vapiNumbers.length === 0 ? (
                <div className="text-center py-8">
                  <Phone className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhum número encontrado na conta VAPI.</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Compre um número no{' '}
                    <a href="https://dashboard.vapi.ai/phone-numbers" target="_blank" rel="noopener noreferrer"
                      className="text-[#c4d82e] underline inline-flex items-center gap-0.5">
                      dashboard VAPI <ExternalLink className="w-3 h-3" />
                    </a>
                    {' '}ou use a opção abaixo.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {vapiNumbers.map(vn => (
                    <div
                      key={vn.id}
                      className={`flex items-center justify-between rounded-xl border p-4 transition-all ${vn.already_imported
                        ? 'bg-green-500/5 border-green-500/20 opacity-60'
                        : 'bg-white/5 border-white/10'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${vn.already_imported ? 'bg-green-500/20' : 'bg-[#c4d82e]/10'
                          }`}>
                          <Phone className={`w-4 h-4 ${vn.already_imported ? 'text-green-400' : 'text-[#c4d82e]'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-white font-mono">{vn.number || '(sem número)'}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {vn.name && <span className="text-xs text-gray-400">{vn.name}</span>}
                            <span className="text-xs text-gray-500 capitalize">{vn.provider}</span>
                            <span className="text-xs text-gray-600 font-mono" title={vn.id}>{vn.id.slice(0, 10)}…</span>
                          </div>
                        </div>
                      </div>

                      {vn.already_imported ? (
                        <span className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-green-500/20 text-green-300 font-medium shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Importado
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleImportNumber(vn)}
                          disabled={importingId === vn.id}
                          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-[#c4d82e]/10 hover:bg-[#c4d82e]/20 border border-[#c4d82e]/30 text-[#c4d82e] font-semibold transition-all disabled:opacity-50 shrink-0"
                        >
                          {importingId === vn.id
                            ? <Loader className="w-3.5 h-3.5 animate-spin" />
                            : <Download className="w-3.5 h-3.5" />
                          }
                          {importingId === vn.id ? 'Importando...' : 'Importar'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setAddMode(null)}
                className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all"
              >
                Fechar
              </button>
            </div>
          )}

          {/* Painel: Importar número existente da conta Twilio */}
          {addMode === 'import_twilio' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-red-400" />
                  Números na sua conta Twilio
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenImportTwilio}
                    disabled={twilioLoading}
                    title="Atualizar lista"
                    className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${twilioLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button type="button" onClick={() => setAddMode(null)} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-xs text-red-300">
                  Estes são todos os números cadastrados na sua conta Twilio configurada neste servidor.
                  Clique em <strong>Importar</strong> para ativá-los no sistema.
                </p>
              </div>

              {twilioLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader className="w-6 h-6 text-red-400 animate-spin" />
                  <span className="text-sm text-gray-400">Buscando números da sua conta Twilio...</span>
                </div>
              ) : twilioNumbers.length === 0 ? (
                <div className="text-center py-8">
                  <Phone className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhum número encontrado na conta Twilio.</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Compre um número lá no console da Twilio para que ele apareça aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {twilioNumbers.map(vn => (
                    <div
                      key={vn.id}
                      className={`flex items-center justify-between rounded-xl border p-4 transition-all ${vn.already_imported
                        ? 'bg-green-500/5 border-green-500/20 opacity-60'
                        : 'bg-white/5 border-white/10'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${vn.already_imported ? 'bg-green-500/20' : 'bg-red-500/10'
                          }`}>
                          <Phone className={`w-4 h-4 ${vn.already_imported ? 'text-green-400' : 'text-red-400'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-white font-mono">{vn.number}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {vn.name && <span className="text-xs text-gray-400">{vn.name}</span>}
                            <span className="text-xs text-gray-500 font-mono" title={vn.id}>{vn.id.slice(0, 8)}…</span>
                          </div>
                        </div>
                      </div>

                      {vn.already_imported ? (
                        <span className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-green-500/20 text-green-300 font-medium shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Importado
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleImportTwilioNumber(vn)}
                          disabled={importingId === vn.id}
                          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-semibold transition-all disabled:opacity-50 shrink-0"
                        >
                          {importingId === vn.id
                            ? <Loader className="w-3.5 h-3.5 animate-spin" />
                            : <Download className="w-3.5 h-3.5" />
                          }
                          {importingId === vn.id ? 'Importando...' : 'Importar'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setAddMode(null)}
                className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all"
              >
                Fechar
              </button>
            </div>
          )}

          {/* Form: Manual (Apenas Cadastro Local) */}
          {addMode === 'manual' && (
            <form onSubmit={handleAddManual} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">Adicionar Número Manual</h4>
                <button type="button" onClick={() => setAddMode(null)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-xs text-blue-300">
                  ℹ️ Este número será salvo apenas localmente na sua conta e pode ser vinculado aos seus robôs sem validação automática em provedores externos.
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Número de Telefone *</label>
                <input
                  type="text"
                  placeholder="+5511999998888"
                  value={manualForm.phone_number}
                  onChange={e => setManualForm(f => ({ ...f, phone_number: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Apelido/Nome (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: WhatsApp de Vendas"
                  value={manualForm.nickname}
                  onChange={e => setManualForm(f => ({ ...f, nickname: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddMode(null)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {saving ? 'Salvando...' : 'Salvar Número'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhoneNumberModal;
