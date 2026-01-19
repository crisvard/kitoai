import React, { useMemo, useState } from 'react';
import { ArrowLeft, CreditCard, Database, FileText, Github, Globe, Key, LinkIcon, NotebookPen, Plus, Receipt, ShieldCheck, Tag, Trash2, X } from 'lucide-react';
import { useWebsiteServices, WebsiteService } from '../hooks/useWebsiteServices';
import { usePlans } from '../hooks/usePlans';
import { supabase } from '../lib/supabase';

interface WebsitePageProps {
  onBack: () => void;
}

const WebsitePage: React.FC<WebsitePageProps> = ({ onBack }) => {
  const { websites, loading, createWebsite, deleteWebsite } = useWebsiteServices();
  const { plans } = usePlans();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState<WebsiteService | null>(null);
  const [detailsTab, setDetailsTab] = useState<'details' | 'notes' | 'payment'>('details');
  const [formData, setFormData] = useState({ site_name: '', segment: '', site_link: '', status: 'paused' });
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Encontrar o plano de website — prioriza pelo ID específico
  const websitePlan = plans?.find((plan: any) => plan.id === 'website');

  // Função para formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleVerifyPayment = async () => {
    if (!selectedWebsite?.payment_id) {
      alert('ID do pagamento não encontrado para este site.');
      return;
    }

    setVerifyingPayment(true);

    try {
      console.log('🔍 [WEBSITE_VERIFY] Verificando pagamento do site:', selectedWebsite.id);

      // Verificar status do pagamento no Asaas
      const { data: statusData, error: statusError } = await supabase.functions.invoke('verify-payment-status', {
        body: { paymentId: selectedWebsite.payment_id }
      });

      if (statusError) {
        console.error('❌ [WEBSITE_VERIFY] Erro na verificação:', statusError);
        alert('Erro ao verificar status do pagamento. Tente novamente.');
        return;
      }

      if (statusData.status === 'RECEIVED') {
        console.log('✅ [WEBSITE_VERIFY] Pagamento confirmado!');

        // Atualizar status na tabela payments se existir
        const { error: paymentUpdateError } = await supabase
          .from('payments')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('external_payment_id', selectedWebsite.payment_id);

        if (paymentUpdateError) {
          console.warn('⚠️ [WEBSITE_VERIFY] Erro ao atualizar tabela payments:', paymentUpdateError);
        }

        // Ativar o website
        const { error: updateError } = await supabase
          .from('user_websites')
          .update({
            status: 'published',
            activated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedWebsite.id);

        if (updateError) {
          console.error('❌ [WEBSITE_VERIFY] Erro ao ativar website:', updateError);
          alert('Erro ao ativar o site. Tente novamente.');
          return;
        }

        // Atualizar o estado local
        setSelectedWebsite(prev => prev ? { ...prev, status: 'published', activated_at: new Date().toISOString() } : null);

        alert('✅ Pagamento confirmado! Site ativado com sucesso.');
      } else {
        console.log('⏳ [WEBSITE_VERIFY] Pagamento ainda pendente:', statusData.status);
        alert('Pagamento ainda não foi confirmado. Tente novamente em alguns instantes.');
      }

    } catch (err: any) {
      console.error('❌ [WEBSITE_VERIFY] Erro ao verificar pagamento:', err);
      alert('Erro ao verificar status do pagamento.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleAddWebsite = async () => {
    if (!formData.site_name.trim()) {
      alert('Nome do site é obrigatório');
      return;
    }
    try {
      await createWebsite({
        site_name: formData.site_name,
        segment: formData.segment,
        site_link: formData.site_link,
        status: 'paused',
        notes: `Obrigado pelo cadastro, aguarde o contato de um desenvolvedor, para que seu projeto seja iniciado, após o cadatro você receberá um contato em até 48 horas.
Nesta aba após a contratação, você verá as infomações de login de seu dominio e com o projeto concluido o link de seu repositório no github.

Atenciosamente,
Kito Expert`
      });
      setShowAddModal(false);
      setFormData({ site_name: '', segment: '', site_link: '', status: 'paused' });
      alert('Website adicionado! Faça o pagamento para ativar.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao adicionar website');
    }
  };

  const handleDeleteWebsite = async (id: string) => {
    if (!window.confirm('Tem certeza?')) return;
    try {
      await deleteWebsite(id);
      if (selectedWebsite?.id === id) setSelectedWebsite(null);
      alert('Website deletado!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao deletar');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c4d82e] mx-auto mb-4"></div>
          <p className="text-white">Carregando websites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Globe className="w-8 h-8 text-[#c4d82e]" />
                  Gerenciar Sites
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Total: <span className="font-bold text-[#c4d82e]">{websites.length}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#c4d82e] text-black px-6 py-3 rounded-lg font-bold hover:bg-[#b5c928] transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Novo Site
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {!selectedWebsite ? (
          // Grid de Cards
          <div>
            {websites.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Nenhum website registrado</h3>
                <p className="text-gray-400 mb-6">Clique em "Novo Site" para começar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {websites.map(website => (
                  <div
                    key={website.id}
                    onClick={() => setSelectedWebsite(website)}
                    className="group relative bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] rounded-2xl border border-gray-800 overflow-hidden transition-all duration-500 hover:border-[#c4d82e]/80 hover:shadow-2xl hover:shadow-[#c4d82e]/30 cursor-pointer transform hover:-translate-y-2"
                  >
                    {/* Animated Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#c4d82e]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      {website.status === 'published' ? (
                        <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-green-400 text-xs font-bold">Ativo</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-gray-700/40 border border-gray-600/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                          <span className="text-gray-200 text-xs font-bold">Pendente</span>
                        </div>
                      )}
                    </div>

                    <div className="p-6 relative z-5">
                      {/* Icon Container */}
                      <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#c4d82e]/30 to-[#c4d82e]/10 rounded-xl mb-4 group-hover:from-[#c4d82e]/40 group-hover:to-[#c4d82e]/20 transition-all duration-500 transform group-hover:scale-110">
                        <Globe className="w-7 h-7 text-[#c4d82e] group-hover:animate-bounce" />
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-white mb-2 truncate group-hover:text-[#c4d82e] transition-colors duration-300">
                        {website.site_name}
                      </h3>

                      {/* Link */}
                      {website.site_link && (
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 truncate group-hover:text-gray-300 transition-colors duration-300">
                          <LinkIcon className="w-4 h-4 text-[#c4d82e] flex-shrink-0" />
                          <span className="truncate text-xs">{website.site_link}</span>
                        </div>
                      )}

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {website.domain_login && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#c4d82e]/20 hover:bg-[#c4d82e]/30 text-[#c4d82e] text-xs font-semibold rounded-lg transition-colors duration-300 border border-[#c4d82e]/30">
                            <Key className="w-3.5 h-3.5" />
                            Credenciais
                          </span>
                        )}
                        {(website as any).github_link && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/40 hover:bg-gray-700/60 text-gray-200 text-xs font-semibold rounded-lg transition-colors duration-300 border border-gray-600/30">
                            <Github className="w-3.5 h-3.5" />
                            GitHub
                          </span>
                        )}
                        {(website as any).hosting_data && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-semibold rounded-lg transition-colors duration-300 border border-blue-500/30">
                            <Database className="w-3.5 h-3.5" />
                            Hospedagem
                          </span>
                        )}
                      </div>

                      {/* Date Footer */}
                      <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500 group-hover:text-gray-400 transition-colors duration-300 flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                        Criado em {new Date(website.created_at).toLocaleDateString('pt-BR')}
                      </div>

                      {/* Hover Action Indicator */}
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <div className="w-8 h-8 bg-[#c4d82e]/20 rounded-lg flex items-center justify-center">
                          <span className="text-[#c4d82e] text-lg animate-pulse">→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Detalhes do Site Selecionado - Layout melhorado
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedWebsite(null)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-semibold"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar
              </button>
              {selectedWebsite.status !== 'published' && (
                <button
                  onClick={() => handleDeleteWebsite(selectedWebsite.id)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Deletar Site
                </button>
              )}
            </div>

            <SelectedWebsiteView 
              selectedWebsite={selectedWebsite} 
              detailsTab={detailsTab} 
              setDetailsTab={setDetailsTab}
              websitePlan={websitePlan}
              formatPrice={formatPrice}
            />
          </div>
        )}
      </div>

      {/* Modal Adicionar Site */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-xl border border-gray-800 p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Novo Site</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ site_name: '', segment: '', site_link: '', status: 'paused' });
                }}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-bold mb-2">Nome do Site</label>
                <input
                  type="text"
                  value={formData.site_name}
                  onChange={e => setFormData({ ...formData, site_name: e.target.value })}
                  placeholder="Ex: Meu Site"
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">Segmento</label>
                <input
                  type="text"
                  value={formData.segment}
                  onChange={e => setFormData({ ...formData, segment: e.target.value })}
                  placeholder="Ex: Clínica, Restaurante, Loja..."
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">Link</label>
                <input
                  type="url"
                  value={formData.site_link}
                  onChange={e => setFormData({ ...formData, site_link: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none"
                />
              </div>

              <div className="flex gap-4 mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={handleAddWebsite}
                  className="flex-1 bg-[#c4d82e] text-black px-6 py-3 rounded-lg font-bold hover:bg-[#b5c928] transition-colors"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ site_name: '', segment: '', site_link: '', status: 'paused' });
                  }}
                  className="flex-1 bg-gray-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsitePage;

function SelectedWebsiteView({
  selectedWebsite,
  detailsTab,
  setDetailsTab,
  websitePlan,
  formatPrice,
}: {
  selectedWebsite: WebsiteService;
  detailsTab: 'details' | 'notes' | 'payment';
  setDetailsTab: React.Dispatch<React.SetStateAction<'details' | 'notes' | 'payment'>>;
  websitePlan: any;
  formatPrice: (price: number) => string;
}) {
  const formatPaymentMethodLabel = (method: string | null | undefined) => {
    const normalized = (method || '').trim().toLowerCase();

    if (!normalized) return '—';

    // Stripe (cartão)
    if (normalized === 'stripe' || normalized === 'card' || normalized === 'credit_card' || normalized === 'credit-card' || normalized === 'cartao' || normalized === 'cartão') {
      return 'Cartão de Crédito';
    }

    // PIX (Asaas)
    if (normalized === 'pix' || normalized === 'asaas_pix' || normalized === 'asaas-pix') {
      return 'Pix';
    }

    // Algumas integrações salvam em maiúsculo
    if (normalized === 'credit card' || normalized === 'creditcard') return 'Cartão de Crédito';

    return normalized.toUpperCase();
  };

  const activationDate = useMemo(() => {
    return selectedWebsite.activated_at || selectedWebsite.created_at;
  }, [selectedWebsite]);

  const paymentMethod = selectedWebsite.payment_method || '';
  const paymentId = selectedWebsite.payment_id || '';
  const paymentMethodLabel = formatPaymentMethodLabel(paymentMethod);

  const tabs = [
    { id: 'details' as const, label: 'Detalhes', Icon: FileText },
    { id: 'notes' as const, label: 'Notas', Icon: NotebookPen },
    { id: 'payment' as const, label: 'Pagamento', Icon: CreditCard },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Info Card */}
      <div className="lg:col-span-1 group relative bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] rounded-2xl border border-gray-800 overflow-hidden transition-all duration-500 hover:border-[#c4d82e]/80 hover:shadow-2xl hover:shadow-[#c4d82e]/20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c4d82e]/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#c4d82e]/30 to-[#c4d82e]/10 rounded-xl group-hover:from-[#c4d82e]/40 group-hover:to-[#c4d82e]/20 transition-all duration-500 transform group-hover:scale-110">
                <Globe className="w-6 h-6 text-[#c4d82e] group-hover:rotate-6 transition-transform duration-500" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-white truncate group-hover:text-[#c4d82e] transition-colors duration-300">
                  {selectedWebsite.site_name}
                </h3>
                {selectedWebsite.status === 'published' ? (
                  <div className="mt-1 inline-flex items-center gap-2 bg-green-500/15 border border-green-500/30 px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-300 text-xs font-bold">Ativo</span>
                  </div>
                ) : (
                  <div className="mt-1 inline-flex items-center gap-2 bg-gray-700/35 border border-gray-600/40 px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                    <span className="text-gray-200 text-xs font-bold">Pendente</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center w-10 h-10 bg-[#c4d82e]/10 rounded-xl border border-[#c4d82e]/20 group-hover:bg-[#c4d82e]/15 transition-colors">
              <ShieldCheck className="w-5 h-5 text-[#c4d82e]" />
            </div>
          </div>
        </div>

        <div className="relative p-6 space-y-5">
          {selectedWebsite.site_link ? (
            <div>
              <div className="text-gray-500 text-xs font-semibold block mb-2 uppercase">Link</div>
              <a
                href={selectedWebsite.site_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#c4d82e] hover:text-[#b5c928] text-sm break-all transition-colors inline-flex items-center gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                {selectedWebsite.site_link}
              </a>
            </div>
          ) : (
            <div>
              <div className="text-gray-500 text-xs font-semibold block mb-2 uppercase">Link</div>
              <div className="text-gray-400 text-sm">—</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-700">
            <div className="rounded-xl border border-gray-800 bg-[#1a1a1a] p-4 transition-all duration-300 hover:border-[#c4d82e]/40">
              <div className="text-gray-500 text-[11px] font-bold uppercase">Criado em</div>
              <div className="text-white text-sm font-semibold mt-1">
                {new Date(selectedWebsite.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-[#1a1a1a] p-4 transition-all duration-300 hover:border-[#c4d82e]/40">
              <div className="text-gray-500 text-[11px] font-bold uppercase">Ativado em</div>
              <div className="text-white text-sm font-semibold mt-1">
                {new Date(activationDate).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="lg:col-span-2 bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] rounded-2xl border border-gray-800 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-700 bg-[#1a1a1a]">
          <div className="grid grid-cols-3 gap-2">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setDetailsTab(id)}
                className={`group relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                  detailsTab === id
                    ? 'bg-gradient-to-r from-[#c4d82e] to-[#b5c928] text-black shadow-lg shadow-[#c4d82e]/20'
                    : 'bg-[#2a2a2a] text-gray-300 hover:text-white hover:bg-[#303030] border border-gray-700'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 ${detailsTab === id ? '' : 'group-hover:-rotate-6 group-hover:scale-110'}`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {detailsTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group relative bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden transition-all duration-500 hover:border-[#c4d82e]/70 hover:shadow-xl hover:shadow-[#c4d82e]/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#c4d82e]/7 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#c4d82e]/15 border border-[#c4d82e]/25 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-[#c4d82e]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-gray-500 text-[11px] font-bold uppercase">Nome do site</div>
                        <div className="text-white font-bold truncate">{selectedWebsite.site_name}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden transition-all duration-500 hover:border-[#c4d82e]/70 hover:shadow-xl hover:shadow-[#c4d82e]/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#c4d82e]/7 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#c4d82e]/15 border border-[#c4d82e]/25 flex items-center justify-center">
                        <LinkIcon className="w-5 h-5 text-[#c4d82e]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-gray-500 text-[11px] font-bold uppercase">Link</div>
                        {selectedWebsite.site_link ? (
                          <a
                            href={selectedWebsite.site_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#c4d82e] hover:text-[#b5c928] font-semibold truncate block"
                          >
                            {selectedWebsite.site_link}
                          </a>
                        ) : (
                          <div className="text-gray-400 font-semibold">—</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden transition-all duration-500 hover:border-[#c4d82e]/70 hover:shadow-xl hover:shadow-[#c4d82e]/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#c4d82e]/7 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#c4d82e]/15 border border-[#c4d82e]/25 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-[#c4d82e]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-gray-500 text-[11px] font-bold uppercase">Segmento</div>
                        {selectedWebsite.segment ? (
                          <div className="text-white font-bold truncate">{selectedWebsite.segment}</div>
                        ) : (
                          <div className="text-gray-400 font-semibold">—</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden transition-all duration-500 hover:border-green-500/40 hover:shadow-xl hover:shadow-green-500/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/25 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-green-300" />
                      </div>
                      <div>
                        <div className="text-gray-500 text-[11px] font-bold uppercase">Status</div>
                        {selectedWebsite.status === 'published' ? (
                          <div className="inline-flex items-center gap-2 text-green-300 font-bold">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            Ativo
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 text-gray-200 font-bold">
                            <span className="w-2 h-2 bg-gray-400 rounded-full" />
                            Pendente
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden transition-all duration-500 hover:border-[#c4d82e]/70 hover:shadow-xl hover:shadow-[#c4d82e]/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#c4d82e]/7 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#c4d82e]/15 border border-[#c4d82e]/25 flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-[#c4d82e]" />
                      </div>
                      <div>
                        <div className="text-gray-500 text-[11px] font-bold uppercase">Pagamento</div>
                        <div className="text-white font-bold">{paymentMethodLabel}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {detailsTab === 'notes' && (
            <div className="group relative bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden transition-all duration-500 hover:border-[#c4d82e]/70 hover:shadow-xl hover:shadow-[#c4d82e]/10">
              <div className="absolute inset-0 bg-gradient-to-br from-[#c4d82e]/7 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#c4d82e]/15 border border-[#c4d82e]/25 flex items-center justify-center">
                    <NotebookPen className="w-5 h-5 text-[#c4d82e]" />
                  </div>
                  <div>
                    <div className="text-white font-bold">Notas</div>
                    <div className="text-gray-500 text-xs">Anotações do projeto</div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-800 bg-[#0f0f0f]/30 p-4">
                  <div className="text-gray-300 whitespace-pre-wrap">
                    {((selectedWebsite as any).notes as string | undefined) || '— Nenhuma nota registrada —'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {detailsTab === 'payment' && (
            <div className="space-y-4">
              {selectedWebsite.status !== 'published' ? (
                <div className="space-y-4">
                  <div className="group relative bg-gradient-to-br from-[#c4d82e]/10 to-transparent rounded-2xl border border-[#c4d82e]/25 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-[#c4d82e]/10">
                    <div className="relative p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-gray-400 text-[11px] font-bold uppercase">Pagamento</div>
                          <div className="text-white font-bold">Este site está pendente de pagamento</div>
                          <div className="text-gray-400 text-sm mt-1">Pagamento único, ativação individual por site.</div>
                        </div>
                        <button
                          onClick={() => {
                            window.location.href = `/direct-payment?plan=website&websiteId=${selectedWebsite.id}`;
                          }}
                          className="bg-[#c4d82e] text-black px-5 py-3 rounded-lg font-bold hover:bg-[#b5c928] transition-colors"
                        >
                          Pagar este site
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedWebsite.payment_id && (
                    <div className="group relative bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl border border-blue-500/25 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10">
                      <div className="relative p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-gray-400 text-[11px] font-bold uppercase">Confirmação de Pagamento</div>
                            <div className="text-white font-bold">Já pagou o PIX?</div>
                            <div className="text-gray-400 text-sm mt-1">Clique para verificar e ativar automaticamente.</div>
                          </div>
                          <button
                            onClick={handleVerifyPayment}
                            disabled={verifyingPayment}
                            className="bg-blue-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {verifyingPayment ? 'Verificando...' : 'Já Paguei - Verificar e Ativar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="group relative bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden transition-all duration-500 hover:border-[#c4d82e]/70 hover:shadow-xl hover:shadow-[#c4d82e]/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#c4d82e]/7 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#c4d82e]/15 border border-[#c4d82e]/25 flex items-center justify-center">
                          <Tag className="w-5 h-5 text-[#c4d82e]" />
                        </div>
                        <div>
                          <div className="text-gray-500 text-[11px] font-bold uppercase">Valor Pago</div>
                          <div className="text-white font-bold">{websitePlan ? formatPrice(websitePlan.price || websitePlan.monthly_price) : 'R$ 149,00'}</div>
                          <div className="text-gray-400 text-xs mt-1">Pagamento único</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="group relative bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden transition-all duration-500 hover:border-[#c4d82e]/70 hover:shadow-xl hover:shadow-[#c4d82e]/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#c4d82e]/7 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#c4d82e]/15 border border-[#c4d82e]/25 flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-[#c4d82e]" />
                        </div>
                        <div>
                          <div className="text-gray-500 text-[11px] font-bold uppercase">Data de ativação</div>
                          <div className="text-white font-bold">
                            {selectedWebsite.status === 'published' ? (
                              new Date(activationDate).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            ) : (
                              '—'
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="group relative bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden transition-all duration-500 hover:border-[#c4d82e]/70 hover:shadow-xl hover:shadow-[#c4d82e]/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#c4d82e]/7 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#c4d82e]/15 border border-[#c4d82e]/25 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-[#c4d82e]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-gray-500 text-[11px] font-bold uppercase">Método</div>
                          <div className="text-white font-bold truncate">{paymentMethodLabel}</div>
                          {paymentId ? (
                            <div className="text-gray-400 text-xs mt-1 truncate">ID: {paymentId}</div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="group relative bg-gradient-to-br from-green-500/10 to-transparent rounded-2xl border border-green-500/30 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-green-500/10">
                <div className="relative p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/25 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-green-300" />
                      </div>
                      <div>
                        <div className="text-gray-400 text-[11px] font-bold uppercase">Status da contratação</div>
                        {selectedWebsite.status === 'published' ? (
                          <div className="flex items-center gap-2 text-green-300 font-bold">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            Ativo e funcional
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-200 font-bold">
                            <span className="w-2 h-2 bg-gray-400 rounded-full" />
                            Pendente de pagamento
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-gray-400 text-sm"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
