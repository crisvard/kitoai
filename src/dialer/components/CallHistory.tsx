import React, { useState } from 'react';
import { Calendar, Clock, Phone, TrendingUp, Download } from 'lucide-react';
import { useDialer } from '../contexts/DialerContext';

const CallHistory: React.FC = () => {
  const { state } = useDialer();
  const [dateFilter, setDateFilter] = useState('all');

  const allCalls = state.campaigns
    .flatMap(campaign => campaign.contacts)
    .filter(contact => contact.lastCallTime)
    .sort((a, b) => new Date(b.lastCallTime!).getTime() - new Date(a.lastCallTime!).getTime());

  const filteredCalls = allCalls.filter(call => {
    if (dateFilter === 'all') return true;

    const callDate = new Date(call.lastCallTime!);
    const today = new Date();
    const diffTime = today.getTime() - callDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (dateFilter) {
      case 'today': return diffDays <= 1;
      case 'week': return diffDays <= 7;
      case 'month': return diffDays <= 30;
      default: return true;
    }
  });

  const stats = {
    total: allCalls.length,
    completed: allCalls.filter(call => call.status === 'completed').length,
    failed: allCalls.filter(call => call.status === 'failed').length,
    totalDuration: allCalls.reduce((sum, call) => sum + (call.duration || 0), 0),
  };

  const successRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const avgDuration = stats.completed > 0 ? stats.totalDuration / stats.completed : 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportToCsv = () => {
    const headers = ['Nome', 'Telefone', 'Status', 'Data da Ligação', 'Duração', 'Notas'];
    const rows = filteredCalls.map(call => [
      call.name,
      call.phone,
      call.status === 'completed' ? 'Concluída' : 'Falhou',
      new Date(call.lastCallTime!).toLocaleString(),
      call.duration ? formatDuration(call.duration) : '-',
      call.notes || '-'
    ]);

    const csvContent = [headers, ...rows].map(row =>
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historico-ligacoes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center">
            <Phone className="w-8 h-8 text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total de Ligações</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Taxa de Sucesso</p>
              <p className="text-2xl font-bold text-white">{successRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-purple-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Duração Média</p>
              <p className="text-2xl font-bold text-white">{formatDuration(Math.round(avgDuration))}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-orange-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Duração Total</p>
              <p className="text-2xl font-bold text-white">{formatDuration(stats.totalDuration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl">
        <div className="px-8 py-6 border-b border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Histórico de Ligações</h2>
              <p className="text-sm text-gray-400 mt-1">
                {filteredCalls.length} ligações encontradas
              </p>
            </div>

            <div className="flex gap-3">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
              >
                <option value="all">Todos os períodos</option>
                <option value="today">Hoje</option>
                <option value="week">Última semana</option>
                <option value="month">Último mês</option>
              </select>

              <button
                onClick={exportToCsv}
                className="flex items-center space-x-2 bg-[#c4d82e] hover:bg-[#b5c928] text-black px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#c4d82e]/30"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Duração
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Notas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredCalls.map((call) => (
                <tr key={`${call.id}-${call.lastCallTime}`} className="hover:bg-white/5">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{call.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {call.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      call.status === 'completed'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {call.status === 'completed' ? 'Concluída' : 'Falhou'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(call.lastCallTime!).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {call.duration ? formatDuration(call.duration) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                    {call.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCalls.length === 0 && (
          <div className="px-8 py-12 text-center">
            <div className="text-gray-400">
              Nenhum histórico de ligação encontrado para o período selecionado.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallHistory;