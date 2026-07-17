import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAgents } from './useAgents';

export interface PhoneNumber {
  id: string;
  user_id: string;
  vapi_phone_number_id: string;
  phone_number: string;
  provider: string;
  nickname: string | null;
  is_active: boolean;
  created_at: string;
  // Campo computado (não existe no banco): qual agente está usando este número
  usedByAgentId?: string;
  usedByAgentName?: string;
}

// Número que existe na conta VAPI (pode ou não estar importado localmente)
export interface VapiPhoneNumber {
  id: string;
  number: string;
  name: string | null;
  provider: string;
  already_imported: boolean;
  connection_id?: string; // Telnyx usa connection_id para SIP Trunking / Call Control
}

export function usePhoneNumbers() {
  const { user } = useAuth();
  const { agents } = useAgents();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPhoneNumbers = useCallback(async () => {
    if (!user) { setPhoneNumbers([]); return; }
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('user_phone_numbers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPhoneNumbers(data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPhoneNumbers();
  }, [loadPhoneNumbers]);

  // Enriquece cada número com o agente que o usa (join local)
  const phoneNumbersWithAgent: PhoneNumber[] = phoneNumbers.map(pn => {
    const agent = agents.find(a => a.phone_number_provider_id === pn.vapi_phone_number_id);
    return {
      ...pn,
      usedByAgentId: agent?.id,
      usedByAgentName: agent?.agent_name,
    };
  });

  // Retorna o conjunto de vapi_phone_number_ids já atribuídos (exceto para um agente específico)
  const getUsedPhoneIds = (excludeAgentId?: string): Set<string> => {
    return new Set(
      agents
        .filter(a => a.phone_number_provider_id && a.id !== excludeAgentId)
        .map(a => a.phone_number_provider_id!)
    );
  };

  // Busca todos os números da conta VAPI usando a chave secreta do servidor
  const fetchVapiNumbers = async (): Promise<VapiPhoneNumber[]> => {
    const { data, error: fnError } = await supabase.functions.invoke('update-vapi-agent', {
      body: { action: 'phone_fetch_from_vapi' },
    });
    if (fnError) throw fnError;
    if (!data.success) throw new Error(data.error);
    return data.vapi_numbers as VapiPhoneNumber[];
  };

  // Busca todos os números da conta Twilio usando as credenciais do servidor
  const fetchTwilioNumbers = async (): Promise<VapiPhoneNumber[]> => {
    const { data, error: fnError } = await supabase.functions.invoke('update-vapi-agent', {
      body: { action: 'phone_fetch_from_twilio' },
    });
    if (fnError) throw fnError;
    if (!data.success) throw new Error(data.error);
    return data.twilio_numbers as VapiPhoneNumber[];
  };

  // Importa um número já existente na conta VAPI para o sistema local
  const importVapiNumber = async (vapiNumber: VapiPhoneNumber, nickname?: string) => {
    const { data, error: fnError } = await supabase.functions.invoke('update-vapi-agent', {
      body: {
        action: 'phone_add_vapi_id',
        vapi_phone_number_id: vapiNumber.id,
        phone_number: vapiNumber.number,
        nickname: nickname || vapiNumber.name || undefined,
      },
    });
    if (fnError) throw fnError;
    if (!data.success) throw new Error(data.error);
    await loadPhoneNumbers();
    return data.phone_number as PhoneNumber;
  };

  // Comprar número direto pela VAPI (requer billing configurado na conta VAPI)
  const buyVapiNumber = async (params: {
    area_code?: string;
    country_code?: string;
    nickname?: string;
  }) => {
    const { data, error: fnError } = await supabase.functions.invoke('update-vapi-agent', {
      body: { action: 'phone_buy_vapi', ...params },
    });
    if (fnError) throw fnError;
    if (!data.success) throw new Error(data.error);
    await loadPhoneNumbers();
    return data.phone_number as PhoneNumber;
  };

  // Adicionar número manual sem validar na VAPI/Twilio
  const addManualNumber = async (params: {
    phone_number: string;
    nickname?: string;
  }) => {
    if (!user) throw new Error('Usuário não autenticado');
    const { data, error } = await supabase
      .from('user_phone_numbers')
      .insert({
        user_id: user.id,
        vapi_phone_number_id: `manual_${Date.now()}`,
        phone_number: params.phone_number,
        provider: 'manual',
        nickname: params.nickname || null,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    await loadPhoneNumbers();
    return data as PhoneNumber;
  };

  // Adicionar número Twilio (usa credenciais configuradas no servidor)
  const addTwilioNumber = async (params: {
    phone_number: string;
    nickname?: string;
  }) => {
    const { data, error: fnError } = await supabase.functions.invoke('update-vapi-agent', {
      body: { action: 'phone_add_twilio', ...params },
    });
    if (fnError) throw fnError;
    if (!data.success) throw new Error(data.error);
    await loadPhoneNumbers();
    return data.phone_number as PhoneNumber;
  };

  // Cadastrar ID VAPI existente (número já está no dashboard VAPI)
  const addVapiId = async (params: {
    vapi_phone_number_id: string;
    phone_number: string;
    nickname?: string;
  }) => {
    const { data, error: fnError } = await supabase.functions.invoke('update-vapi-agent', {
      body: { action: 'phone_add_vapi_id', ...params },
    });
    if (fnError) throw fnError;
    if (!data.success) throw new Error(data.error);
    await loadPhoneNumbers();
    return data.phone_number as PhoneNumber;
  };

  // Remover número
  const deletePhoneNumber = async (phoneNumberId: string) => {
    const { data, error: fnError } = await supabase.functions.invoke('update-vapi-agent', {
      body: { action: 'phone_delete', phone_number_id: phoneNumberId },
    });
    if (fnError) throw fnError;
    if (!data.success) throw new Error(data.error);
    await loadPhoneNumbers();
  };

  // ─── TELNYX ─────────────────────────────────────────────────────────────

  // Busca todos os números da conta Telnyx do usuário
  const fetchTelnyxNumbers = async (): Promise<VapiPhoneNumber[]> => {
    const { data, error: fnError } = await supabase.functions.invoke('telnyx-manage-agent', {
      body: { action: 'list_phone_numbers' },
    });
    if (fnError) throw fnError;
    if (!data.success) throw new Error(data.error);

    // Enriquecer com flag already_imported
    const importedIds = new Set(phoneNumbers.map(pn => pn.vapi_phone_number_id));
    return (data.telnyx_numbers || []).map((num: any) => ({
      ...num,
      // Se number.id == vapi_phone_number_id ou number.connection_id == vapi_phone_number_id
      already_imported: importedIds.has(num.id) || (num.connection_id && importedIds.has(num.connection_id)),
    }));
  };

  // Importa um número Telnyx para o sistema local
  const importTelnyxNumber = async (telnyxNumber: VapiPhoneNumber, nickname?: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    // Telnyx exige um Call Control / SIP Trunk (connection_id) para fazer/receber ligações
    const identifier = telnyxNumber.connection_id || telnyxNumber.id;

    const { error: insertError } = await supabase
      .from('user_phone_numbers')
      .insert({
        user_id: user.id,
        vapi_phone_number_id: identifier, // O sistema precisa disso para iniciar a chamada
        phone_number: telnyxNumber.number,
        provider: 'telnyx',
        nickname: nickname || telnyxNumber.name || null,
        is_active: true,
      });

    if (insertError) throw insertError;
    await loadPhoneNumbers();
  };

  return {
    phoneNumbers: phoneNumbersWithAgent,
    loading,
    error,
    loadPhoneNumbers,
    fetchVapiNumbers,
    fetchTwilioNumbers,
    fetchTelnyxNumbers,
    importVapiNumber,
    importTelnyxNumber,
    buyVapiNumber,
    addTwilioNumber,
    addManualNumber,
    addVapiId,
    deletePhoneNumber,
    getUsedPhoneIds,
  };
}
