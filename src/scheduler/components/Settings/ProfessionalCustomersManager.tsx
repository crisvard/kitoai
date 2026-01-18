import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useProfessionalAuth } from '../../contexts/ProfessionalAuthContext';
import { User, Phone, Search, Calendar } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  professional_id: string;
  created_at: string;
}

interface ProfessionalCustomersManagerProps {
  onCustomerClickForAppointment?: (customer: Customer) => void;
}

export default function ProfessionalCustomersManager({ onCustomerClickForAppointment }: ProfessionalCustomersManagerProps) {
  const { professional } = useProfessionalAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (professional) {
      loadCustomers();
    }
  }, [professional]);

  const loadCustomers = async () => {
    if (!professional) return;

    try {
      setLoading(true);
      // Use customers table for professionals
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, professional_id, created_at')
        .eq('professional_id', professional.id)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      alert('Erro ao carregar clientes. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c4d82e]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-2xl flex items-center justify-center">
            <User className="w-6 h-6 text-[#c4d82e]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Meus Clientes</h2>
            <p className="text-gray-400">Seus clientes atribuídos (gerenciados pelo administrador)</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:ring-2 focus:ring-[#c4d82e] focus:border-transparent transition-all duration-300"
        />
      </div>

      {/* Customers List */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-[#c4d82e]" />
            </div>
            <p className="text-gray-400 text-lg">
              {searchTerm ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className="p-6 hover:bg-white/5 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-2xl flex items-center justify-center">
                      <User className="w-6 h-6 text-[#c4d82e]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{customer.name}</h3>
                      <p className="text-gray-400 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {customer.phone}
                      </p>
                      <p className="text-sm text-gray-500">
                        Cliente desde {new Date(customer.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onCustomerClickForAppointment?.(customer)}
                      className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 rounded-xl transition-all duration-300 transform hover:scale-110"
                      title="Novo Agendamento"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}