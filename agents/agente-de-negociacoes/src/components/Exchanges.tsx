import { useState } from 'react';
import { Plus, CheckCircle, XCircle, Settings, Trash2, AlertCircle, Info } from 'lucide-react';
import { EXCHANGE_LIST } from '../config/exchanges';

export default function Exchanges() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState('');
  const [formData, setFormData] = useState({ apiKey: '', apiSecret: '' });

  const connectedExchanges = [
    { name: 'Binance', status: 'active', balance: 'R$ 85.420,00', assets: 3, lastSync: '2 minutos atrás' },
    { name: 'OKEx', status: 'active', balance: 'R$ 28.340,00', assets: 2, lastSync: '5 minutos atrás' },
    { name: 'Bitso', status: 'active', balance: 'R$ 2.750,00', assets: 1, lastSync: '10 minutos atrás' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Exchanges</h2>
          <p className="text-slate-400">Gerencie suas exchanges conectadas</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/50"
        >
          <Plus size={20} />
          Adicionar Exchange
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectedExchanges.map((exchange, index) => (
          <div
            key={index}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{exchange.name}</h3>
                <div className="flex items-center gap-2">
                  {exchange.status === 'active' ? (
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
                <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
                  <Settings size={18} className="text-slate-400 hover:text-white" />
                </button>
                <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
                  <Trash2 size={18} className="text-slate-400 hover:text-red-400" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Saldo Total</span>
                <span className="text-white font-semibold">{exchange.balance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Ativos</span>
                <span className="text-white font-semibold">{exchange.assets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Última Sinc.</span>
                <span className="text-slate-400 text-sm">{exchange.lastSync}</span>
              </div>
            </div>

            <button className="w-full mt-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium">
              Sincronizar Agora
            </button>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full mx-4 border border-slate-700 animate-slideUp">
            <h3 className="text-2xl font-bold text-white mb-6">Adicionar Exchange</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {EXCHANGE_LIST.map((exchange) => (
                <button
                  key={exchange.id}
                  onClick={() => setSelectedExchange(exchange.name)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedExchange === exchange.name
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{exchange.logo}</span>
                    <span className="text-white font-semibold text-lg">{exchange.displayName}</span>
                  </div>
                  <p className="text-slate-400 text-sm">{exchange.description}</p>
                </button>
              ))}
            </div>

            {selectedExchange && (
              <div className="space-y-4 mb-6 animate-fadeIn">
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex gap-3">
                    <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-blue-400 font-medium text-sm mb-2">Como obter suas credenciais:</p>
                      <ol className="text-blue-300 text-xs space-y-1 list-decimal list-inside">
                        <li>Acesse a plataforma {selectedExchange}</li>
                        <li>Vá para Configurações &gt; Segurança &gt; API</li>
                        <li>Crie uma nova API key com permissões: Read + Trade</li>
                        <li>Cole a chave e secret abaixo</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-2 text-sm">API Key</label>
                  <input
                    type="text"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Cole sua API key aqui"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-2 text-sm">API Secret</label>
                  <input
                    type="password"
                    value={formData.apiSecret}
                    onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                    placeholder="Cole sua API secret aqui"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex gap-2">
                    <AlertCircle className="text-amber-400 flex-shrink-0" size={18} />
                    <p className="text-amber-400 text-xs">
                      Nunca compartilhe seu API Secret. Suas credenciais são criptografadas e armazenadas com segurança no nosso servidor.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={!selectedExchange}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Conectar Exchange
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
