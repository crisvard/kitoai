import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useProfessionalAuth } from '../../contexts/ProfessionalAuthContext';
import { Scissors, DollarSign, Clock } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

export default function ProfessionalServicesList() {
  const { professional } = useProfessionalAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, [professional]);

  const loadServices = async () => {
    console.log('🔍 [ProfessionalServicesList] Iniciando loadServices');
    console.log('👤 [ProfessionalServicesList] Professional:', professional);

    if (!professional) {
      console.log('❌ [ProfessionalServicesList] Nenhum profissional logado');
      return;
    }

    try {
      setLoading(true);
      console.log('⏳ [ProfessionalServicesList] Carregando serviços para profissional:', professional.id);

      // Load services for this professional via junction table
      console.log('📡 [ProfessionalServicesList] Consultando professional_services...');
      const { data: professionalServiceIds, error: junctionError } = await supabase
        .from('professional_services')
        .select('service_id')
        .eq('professional_id', professional.id);

      console.log('📊 [ProfessionalServicesList] Dados de professional_services:', professionalServiceIds);
      console.log('❌ [ProfessionalServicesList] Erro professional_services:', junctionError);

      if (junctionError) throw junctionError;

      if (professionalServiceIds && professionalServiceIds.length > 0) {
        const serviceIds = professionalServiceIds.map((ps: any) => ps.service_id);
        console.log('🆔 [ProfessionalServicesList] Service IDs encontrados:', serviceIds);

        console.log('📡 [ProfessionalServicesList] Consultando services...');
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id, name, price, duration_minutes')
          .in('id', serviceIds)
          .eq('active', true)
          .order('name');

        console.log('📊 [ProfessionalServicesList] Dados de services:', servicesData);
        console.log('❌ [ProfessionalServicesList] Erro services:', servicesError);

        if (servicesError) throw servicesError;

        console.log('✅ [ProfessionalServicesList] Serviços carregados:', servicesData?.length || 0);
        setServices(servicesData || []);
      } else {
        console.log('⚠️ [ProfessionalServicesList] Nenhum service_id encontrado para este profissional');
        setServices([]);
      }
    } catch (error) {
      console.error('❌ [ProfessionalServicesList] Erro carregando serviços:', error);
      setServices([]);
    } finally {
      console.log('🏁 [ProfessionalServicesList] Finalizando loadServices');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c4d82e]"></div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <Scissors className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">Nenhum serviço atribuído</p>
        <p className="text-sm text-gray-500 mt-2">Entre em contato com o administrador para atribuir serviços</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <div
          key={service.id}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#c4d82e]/20 rounded-xl flex items-center justify-center">
              <Scissors className="w-6 h-6 text-[#c4d82e]" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{service.name}</h3>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-semibold">R$ {service.price.toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400">{service.duration_minutes} minutos</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}