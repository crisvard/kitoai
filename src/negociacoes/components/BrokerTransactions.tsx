import { History, Filter, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';

export default function BrokerTransactions() {
  const [filter, setFilter] = useState('all');

  const transactions = [
    { id: 1, date: '12/03/2026', type: 'buy', asset: 'PETR4', quantity: 50, price: 'R$ 38,50', total: 'R$ 1.925,00', status: 'completed', broker: 'Rico' },
    { id: 2, date: '11/03/2026', type: 'sell', asset: 'VALE3', quantity: 25, price: 'R$ 68,20', total: 'R$ 1.705,00', status: 'completed', broker: 'XP' },
    { id: 3, date: '10/03/2026', type: 'buy', asset: 'BOVA11', quantity: 10, price: 'R$ 135,00', total: 'R$ 1.350,00', status: 'completed', broker: 'Rico' },
    { id: 4, date: '09/03/2026', type: 'buy', asset: 'MGLU3', quantity: 100, price: 'R$ 8,20', total: 'R$ 820,00', status: 'completed', broker: 'Rico' },
    { id: 5, date: '08/03/2026', type: 'sell', asset: 'WEGE3', quantity: 30, price: 'R$ 35,40', total: 'R$ 1.062,00', status: 'completed', broker: 'XP' },
    { id: 6, date: '07/03/2026', type: 'buy', asset: 'ITUB4', quantity: 75, price: 'R$ 29,80', total: 'R$ 2.235,00', status: 'pending', broker: 'XP' },
    { id: 7, date: '06/03/2026', type: 'buy', asset: 'PETR4', quantity: 30, price: 'R$ 38,00', total: 'R$ 1.140,00', status: 'completed', broker: 'Rico' },
    { id: 8, date: '05/03/2026', type: 'sell', asset: 'MGLU3', quantity: 50, price: 'R$ 8,50', total: 'R$ 425,00', status: 'completed', broker: 'Rico' },
  ];

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  const summary = {
    totalBuys: 12500,
    totalSells: 4500,
    netProfit: 2100,
    transactionsCount: transactions.length,
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Histórico de Operações</h2>
        <p className="text-gray-400">Todas as suas operações na bolsa</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="text-green-400" size={20} />
            </div>
            <span className="text-gray-400 text-sm">Total Compras</span>
          </div>
          <p className="text-2xl font-bold text-white">R$ {summary.totalBuys.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <TrendingDown className="text-red-400" size={20} />
            </div>
            <span className="text-gray-400 text-sm">Total Vendas</span>
          </div>
          <p className="text-2xl font-bold text-white">R$ {summary.totalSells.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#c4d82e]/10 rounded-lg">
              <History className="text-[#c4d82e]" size={20} />
            </div>
            <span className="text-gray-400 text-sm">Lucro Líquido</span>
          </div>
          <p className="text-2xl font-bold text-green-400">+R$ {summary.netProfit.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <History className="text-purple-400" size={20} />
            </div>
            <span className="text-gray-400 text-sm">Total Operações</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary.transactionsCount}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Filter className="text-gray-400" size={20} />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-[#c4d82e] text-black'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('buy')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'buy'
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                Compras
              </button>
              <button
                onClick={() => setFilter('sell')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'sell'
                    ? 'bg-red-500 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                Vendas
              </button>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
            <Download size={18} />
            Exportar
          </button>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 font-medium pb-4">Data</th>
                <th className="text-left text-gray-400 font-medium pb-4">Tipo</th>
                <th className="text-left text-gray-400 font-medium pb-4">Ativo</th>
                <th className="text-right text-gray-400 font-medium pb-4">Qtd</th>
                <th className="text-right text-gray-400 font-medium pb-4">Preço</th>
                <th className="text-right text-gray-400 font-medium pb-4">Total</th>
                <th className="text-left text-gray-400 font-medium pb-4">Corretora</th>
                <th className="text-left text-gray-400 font-medium pb-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 text-white">{tx.date}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      tx.type === 'buy' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {tx.type === 'buy' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {tx.type === 'buy' ? 'Compra' : 'Venda'}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-white font-medium">{tx.asset}</span>
                  </td>
                  <td className="py-4 text-right text-white">{tx.quantity}</td>
                  <td className="py-4 text-right text-white">{tx.price}</td>
                  <td className="py-4 text-right text-white font-medium">{tx.total}</td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-gray-300 text-sm">
                      {tx.broker}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'completed' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {tx.status === 'completed' ? 'Concluída' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
