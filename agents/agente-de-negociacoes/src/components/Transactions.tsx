import { ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import { useState } from 'react';

export default function Transactions() {
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  const transactions = [
    {
      id: '1',
      type: 'buy',
      symbol: 'BTC',
      name: 'Bitcoin',
      exchange: 'Binance',
      amount: '0.0842',
      price: 'R$ 146.250',
      total: 'R$ 12.310,00',
      status: 'completed',
      date: '2024-01-15 14:32',
    },
    {
      id: '2',
      type: 'sell',
      symbol: 'ETH',
      name: 'Ethereum',
      exchange: 'OKEx',
      amount: '0.5',
      price: 'R$ 13.210',
      total: 'R$ 6.605,00',
      status: 'completed',
      date: '2024-01-15 12:18',
    },
    {
      id: '3',
      type: 'buy',
      symbol: 'SOL',
      name: 'Solana',
      exchange: 'Bitso',
      amount: '10',
      price: 'R$ 61',
      total: 'R$ 610,00',
      status: 'pending',
      date: '2024-01-15 10:45',
    },
    {
      id: '4',
      type: 'buy',
      symbol: 'ADA',
      name: 'Cardano',
      exchange: 'Toro',
      amount: '500',
      price: 'R$ 2.52',
      total: 'R$ 1.260,00',
      status: 'completed',
      date: '2024-01-14 16:22',
    },
    {
      id: '5',
      type: 'sell',
      symbol: 'BNB',
      name: 'Binance Coin',
      exchange: 'Binance',
      amount: '2',
      price: 'R$ 564',
      total: 'R$ 1.128,00',
      status: 'failed',
      date: '2024-01-14 09:15',
    },
  ];

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterStatus !== 'all' && tx.status !== filterStatus) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={18} className="text-green-400" />;
      case 'pending':
        return <Clock size={18} className="text-yellow-400" />;
      case 'failed':
        return <XCircle size={18} className="text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'pending':
        return 'Pendente';
      case 'failed':
        return 'Falhou';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const stats = [
    { label: 'Total de Operações', value: transactions.length.toString() },
    { label: 'Compras', value: transactions.filter(t => t.type === 'buy').length.toString() },
    { label: 'Vendas', value: transactions.filter(t => t.type === 'sell').length.toString() },
    { label: 'Volume Total', value: 'R$ 22.913,00' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Histórico de Transações</h2>
        <p className="text-slate-400">Acompanhe todas as suas operações</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
          >
            <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-slate-400" />
            <span className="text-white font-medium">Filtros:</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filterType === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterType('buy')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filterType === 'buy'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Compras
            </button>
            <button
              onClick={() => setFilterType('sell')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filterType === 'sell'
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Vendas
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filterStatus === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Todos Status
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filterStatus === 'completed'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Concluídas
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filterStatus === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Pendentes
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-slate-400 font-medium pb-4">Tipo</th>
                <th className="text-left text-slate-400 font-medium pb-4">Ativo</th>
                <th className="text-left text-slate-400 font-medium pb-4">Exchange</th>
                <th className="text-right text-slate-400 font-medium pb-4">Quantidade</th>
                <th className="text-right text-slate-400 font-medium pb-4">Preço</th>
                <th className="text-right text-slate-400 font-medium pb-4">Total</th>
                <th className="text-center text-slate-400 font-medium pb-4">Status</th>
                <th className="text-right text-slate-400 font-medium pb-4">Data</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-slate-700/30 hover:bg-slate-900/50 transition-colors"
                >
                  <td className="py-4">
                    <div className={`flex items-center gap-2 ${tx.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'buy' ? (
                        <ArrowUpCircle size={20} />
                      ) : (
                        <ArrowDownCircle size={20} />
                      )}
                      <span className="font-semibold capitalize">{tx.type === 'buy' ? 'Compra' : 'Venda'}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {tx.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{tx.symbol}</p>
                        <p className="text-slate-400 text-sm">{tx.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-slate-700/50 rounded-full text-slate-300 text-sm">
                      {tx.exchange}
                    </span>
                  </td>
                  <td className="py-4 text-right text-white">{tx.amount}</td>
                  <td className="py-4 text-right text-slate-300">{tx.price}</td>
                  <td className="py-4 text-right text-white font-semibold">{tx.total}</td>
                  <td className="py-4">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(tx.status)}
                      <span className={`text-sm font-medium ${getStatusColor(tx.status)}`}>
                        {getStatusText(tx.status)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-right text-slate-400 text-sm">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
