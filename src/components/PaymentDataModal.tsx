import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  description: string;
}

type BillingType = 'PIX' | 'CREDIT_CARD';

interface PaymentDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  selectedPlan: Plan | null;
  billingType: BillingType;
  onBillingTypeChange: (type: BillingType) => void;
}

interface FormData {
  cpf: string;
  phone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const PaymentDataModal: React.FC<PaymentDataModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedPlan,
  billingType,
  onBillingTypeChange
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    cpf: '',
    phone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Estados brasileiros
  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Buscar CEP automaticamente
  const buscarCEP = async (cep: string) => {
    if (cep.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setCepLoading(false);
    }
  };

  // Validar CPF
  const validarCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11) return false;

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) return false;

    // Calcular dígitos verificadores
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;

    return digito1 === parseInt(cpf.charAt(9)) && digito2 === parseInt(cpf.charAt(10));
  };

  // Validar formulário
  const validarFormulario = (): boolean => {
    const novosErros: Partial<FormData> = {};

    if (!formData.cpf || !validarCPF(formData.cpf)) {
      novosErros.cpf = 'CPF inválido';
    }

    if (!formData.phone || formData.phone.replace(/\D/g, '').length < 10) {
      novosErros.phone = 'Telefone inválido (mínimo 10 dígitos)';
    }

    if (!formData.cep || formData.cep.replace(/\D/g, '').length !== 8) {
      novosErros.cep = 'CEP inválido';
    }

    if (!formData.logradouro) {
      novosErros.logradouro = 'Logradouro obrigatório';
    }

    if (!formData.numero) {
      novosErros.numero = 'Número obrigatório';
    }

    if (!formData.bairro) {
      novosErros.bairro = 'Bairro obrigatório';
    }

    if (!formData.cidade) {
      novosErros.cidade = 'Cidade obrigatória';
    }

    if (!formData.estado) {
      novosErros.estado = 'Estado obrigatório';
    }

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Salvar dados e confirmar
  const handleConfirm = async () => {
    if (!validarFormulario() || !user) return;

    setLoading(true);
    try {
      // Salvar dados no perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          cpf: formData.cpf.replace(/\D/g, ''),
          phone: formData.phone.replace(/\D/g, ''),
          cep: formData.cep.replace(/\D/g, ''),
          logradouro: formData.logradouro,
          numero: formData.numero,
          complemento: formData.complemento,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Confirmar contratação
      onConfirm({
        ...formData,
        billingType
      });

      onClose();
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      setErrors({ cpf: 'Erro ao salvar dados. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  // Máscaras
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{4})$/, '$1-$2')
      .substring(0, 15);
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-8 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white mb-2">Complete seus dados</h2>
          <p className="text-gray-400">
            Precisamos dessas informações para processar seu pagamento e ativar o plano.
          </p>
        </div>

        {/* Form */}
        <div className="p-8 space-y-6">
          {/* Dados Pessoais */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CPF *
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-[#c4d82e] focus:outline-none transition-colors"
                  placeholder="000.000.000-00"
                />
                {errors.cpf && <p className="text-red-400 text-sm mt-1">{errors.cpf}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefone *
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-[#c4d82e] focus:outline-none transition-colors"
                  placeholder="(00) 00000-0000"
                />
                {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Endereço</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CEP *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.cep}
                      onChange={(e) => {
                        const value = formatCEP(e.target.value);
                        setFormData(prev => ({ ...prev, cep: value }));
                        if (value.replace(/\D/g, '').length === 8) {
                          buscarCEP(value.replace(/\D/g, ''));
                        }
                      }}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-[#c4d82e] focus:outline-none transition-colors"
                      placeholder="00000-000"
                    />
                    {cepLoading && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#c4d82e]"></div>
                      </div>
                    )}
                  </div>
                  {errors.cep && <p className="text-red-400 text-sm mt-1">{errors.cep}</p>}
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Número *
                  </label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-[#c4d82e] focus:outline-none transition-colors"
                    placeholder="123"
                  />
                  {errors.numero && <p className="text-red-400 text-sm mt-1">{errors.numero}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Logradouro *
                </label>
                <input
                  type="text"
                  value={formData.logradouro}
                  onChange={(e) => setFormData(prev => ({ ...prev, logradouro: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-[#c4d82e] focus:outline-none transition-colors"
                  placeholder="Rua das Flores"
                />
                {errors.logradouro && <p className="text-red-400 text-sm mt-1">{errors.logradouro}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={formData.complemento}
                    onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-[#c4d82e] focus:outline-none transition-colors"
                    placeholder="Apto 123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    value={formData.bairro}
                    onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-[#c4d82e] focus:outline-none transition-colors"
                    placeholder="Centro"
                  />
                  {errors.bairro && <p className="text-red-400 text-sm mt-1">{errors.bairro}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-[#c4d82e] focus:outline-none transition-colors"
                    placeholder="São Paulo"
                  />
                  {errors.cidade && <p className="text-red-400 text-sm mt-1">{errors.cidade}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Estado *
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#c4d82e] focus:outline-none transition-colors"
                  >
                    <option value="">Selecione...</option>
                    {estados.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                  {errors.estado && <p className="text-red-400 text-sm mt-1">{errors.estado}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Método de Pagamento */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Método de Pagamento</h3>
            <div className="space-y-3">
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  billingType === 'PIX'
                    ? 'border-[#c4d82e] bg-[#c4d82e]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                onClick={() => onBillingTypeChange('PIX')}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={billingType === 'PIX'}
                    onChange={() => onBillingTypeChange('PIX')}
                    className="mr-3"
                  />
                  <div>
                    <h4 className="font-medium text-white">PIX</h4>
                    <p className="text-sm text-gray-400">
                      Pagamento instantâneo e gratuito
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  billingType === 'CREDIT_CARD'
                    ? 'border-[#c4d82e] bg-[#c4d82e]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                onClick={() => onBillingTypeChange('CREDIT_CARD')}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={billingType === 'CREDIT_CARD'}
                    onChange={() => onBillingTypeChange('CREDIT_CARD')}
                    className="mr-3"
                  />
                  <div>
                    <h4 className="font-medium text-white">Cartão de Crédito</h4>
                    <p className="text-sm text-gray-400">
                      Parcelamento automático mensal
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/10 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-white/20 rounded-xl text-gray-300 hover:text-white hover:border-white/40 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-[#c4d82e] to-[#b5c928] hover:from-[#b5c928] hover:to-[#a6c025] text-black font-bold rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-[#c4d82e]/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Confirmar e Contratar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDataModal;