import React, { useState } from 'react';
import { Phone, Mail, Building, Search, Filter } from 'lucide-react';
import { useDialer } from '../contexts/DialerContext';

const ContactsTable: React.FC = () => {
  const { state, makeCall } = useDialer();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const contacts = state.currentCampaign?.contacts || [];

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm) ||
                         (contact.email?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
      case 'calling': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'calling': return 'Chamando';
      case 'completed': return 'Concluída';
      case 'failed': return 'Falhou';
      default: return status;
    }
  };

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl">
      <div className="px-8 py-6 border-b border-white/10">
        <h2 className="text-xl font-semibold text-white">Contatos</h2>
        <p className="text-sm text-gray-400 mt-1">
          {filteredContacts.length} de {contacts.length} contatos
        </p>
      </div>

      {/* Filters */}
      <div className="px-8 py-6 border-b border-white/10">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="calling">Chamando</option>
              <option value="completed">Concluída</option>
              <option value="failed">Falhou</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
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
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Empresa
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Última Ligação
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredContacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-white/5">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{contact.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-300">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {contact.phone}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {contact.email && (
                    <div className="flex items-center text-sm text-gray-300">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {contact.email}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {contact.company && (
                    <div className="flex items-center text-sm text-gray-300">
                      <Building className="w-4 h-4 mr-2 text-gray-400" />
                      {contact.company}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(contact.status)}`}>
                    {getStatusLabel(contact.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {contact.lastCallTime ? (
                    <div>
                      <div>{new Date(contact.lastCallTime).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(contact.lastCallTime).toLocaleTimeString()}
                      </div>
                      {contact.duration && (
                        <div className="text-xs text-gray-500">
                          {Math.floor(contact.duration / 60)}:{(contact.duration % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => makeCall(contact.id)}
                    disabled={contact.status === 'calling'}
                    className="text-[#c4d82e] hover:text-[#b5c928] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {contact.status === 'calling' ? 'Chamando...' : 'Ligar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredContacts.length === 0 && (
        <div className="px-8 py-12 text-center">
          <div className="text-gray-400">
            {searchTerm || statusFilter !== 'all'
              ? 'Nenhum contato encontrado com os filtros aplicados.'
              : 'Nenhum contato carregado. Carregue contatos do Google Sheets no Dashboard.'
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsTable;