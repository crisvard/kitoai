import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit, Save, X, Globe, Link as LinkIcon, Key, Database, Github, FileText, Images, Eye, EyeOff, Check, Calendar, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWebsiteServices, WebsiteService } from '../hooks/useWebsiteServices';
import { usePlans } from '../hooks/usePlans';
import { useUserProfile } from '../hooks/useUserProfile';

interface WebsitePageProps {
  onBack: () => void;
}

const WebsitePage: React.FC<WebsitePageProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState<WebsiteService | null>(null);
  const [detailsTab, setDetailsTab] = useState<'details' | 'notes' | 'payment'>('details');

  const { websites, loading, error, createWebsite, updateWebsite, deleteWebsite } = useWebsiteServices();
  const { plans } = usePlans();
  const { profile } = useUserProfile();
  
  // Buscar o plano de Website
  const websitePlan = plans?.find(plan =>
    plan.name?.toLowerCase().includes('website') ||
    plan.name?.toLowerCase().includes('site') ||
    plan.id === 'website'
  );
  
  // Debug do plano e profile
  console.log('🌐 [WEBSITE] Plano encontrado:', websitePlan);
  console.log('💰 [WEBSITE] Preço mensal:', websitePlan?.monthly_price);
  console.log('👤 [WEBSITE] Profile:', profile);
  console.log('✅ [WEBSITE] website_active:', profile?.website_active);
  console.log('🔖 [WEBSITE] activeTab:', activeTab);
  console.log('💾 [WEBSITE] localStorage tab:', localStorage.getItem('websitePage_activeTab'));
  
  // useEffect para monitorar website_active
  useEffect(() => {
    console.log('� [WEBSITE_PAGE] Profile mudou');
    console.log('✅ website_active:', profile?.website_active);
    console.log('📅 website_activation_date:', profile?.website_activation_date);
    
    if (profile?.website_active === true) {
      console.log('✅ Alterando para aba payment');
      setActiveTab('payment');
      localStorage.setItem('websitePage_activeTab', 'payment');
    }
  }, [profile?.website_active]);
  
  // Formatar preço para exibição
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Salvar tab no localStorage quando muda
  const handleTabChange = (tab: 'websites' | 'statistics' | 'details' | 'notes' | 'contract' | 'payment') => {
    setActiveTab(tab);
    localStorage.setItem('websitePage_activeTab', tab);
  };

  const [formData, setFormData] = useState({
    site_name: '', // Será o segmento
    site_link: '',
    segment: '', // Campo para segmento/categoria
    service_name: '',
    domain_login: '',
    domain_password: '',
    domain_registrar: '', // Empresa/registrador do domínio
    github_link: '',
    hosting_data: {
      provider: '',
      host: '',
      plan: '',
      account: '',
      notes: '',
    },
    social_links: [] as Array<{ platform: string; url: string }>,
    site_photos: [] as Array<{ url: string; name?: string }>,
    notes: '',
    status: 'active' as const,
  });

  const handleAddWebsite = async () => {
    if (!formData.site_name.trim()) {
      alert('Nome do site é obrigatório');
      return;
    }

    try {
      await createWebsite(formData);
      setShowAddModal(false);
      resetForm();
      alert('Website adicionado com sucesso!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao adicionar website');
    }
  };

  const handleUpdateWebsite = async () => {
    if (!editingWebsite) return;

    try {
      await updateWebsite(editingWebsite.id, formData);
      setEditingWebsite(null);
      setSelectedWebsite(null);
      resetForm();
      alert('Website atualizado com sucesso!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar website');
    }
  };

  const handleDeleteWebsite = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este website?')) return;

    try {
      await deleteWebsite(id);
      if (selectedWebsite?.id === id) {
        setSelectedWebsite(null);
      }
      alert('Website deletado com sucesso!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao deletar website');
    }
  };

  const handleSelectWebsite = (website: WebsiteService) => {
    setSelectedWebsite(website);
    setFormData({
      site_name: website.site_name,
      site_link: website.site_link || '',
      service_name: (website as any).service_name || '',
      domain_login: website.domain_login || '',
      domain_password: website.domain_password || '',
      domain_registrar: (website as any).domain_registrar || '',
      github_link: website.github_link || '',
      hosting_data: website.hosting_data || {
        provider: '',
        host: '',
        plan: '',
        account: '',
        notes: '',
      },
      social_links: website.social_links || [],
      site_photos: website.site_photos || [],
      notes: website.notes || '',
      status: website.status,
    });
  };

  const handleEditWebsite = (website: WebsiteService) => {
    setEditingWebsite(website);
    handleSelectWebsite(website);
    handleTabChange('details');
  };

  const resetForm = () => {
    setFormData({
      site_name: '',
      site_link: '',
      segment: '',
      service_name: '',
      domain_login: '',
      domain_password: '',
      domain_registrar: '',
      github_link: '',
      hosting_data: {
        provider: '',
        host: '',
        plan: '',
        account: '',
        notes: '',
      },
      social_links: [],
      site_photos: [],
      notes: '',
      status: 'active',
    });
  };

  const addSocialLink = () => {
    setFormData(prev => ({
      ...prev,
      social_links: [...prev.social_links, { platform: '', url: '' }],
    }));
  };

  const removeSocialLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index),
    }));
  };

  const updateSocialLink = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: prev.social_links.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const addPhotoLink = () => {
    setFormData(prev => ({
      ...prev,
      site_photos: [...prev.site_photos, { url: '', name: '' }],
    }));
  };

  const removePhotoLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      site_photos: prev.site_photos.filter((_, i) => i !== index),
    }));
  };

  const updatePhotoLink = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      site_photos: prev.site_photos.map((photo, i) =>
        i === index ? { ...photo, [field]: value } : photo
      ),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c4d82e] mx-auto mb-4"></div>
          <div className="text-white text-xl">Carregando websites...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Globe className="w-8 h-8 text-[#c4d82e]" />
                  Gerenciamento de Websites
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Total de projetos: <span className="font-bold text-[#c4d82e]">{websites.length}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowAddModal(true);
                resetForm();
                setEditingWebsite(null);
              }}
              className="bg-[#c4d82e] text-black px-6 py-3 rounded-lg font-bold hover:bg-[#b5c928] transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Novo Website
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-800">
            {['websites', 'statistics', 'details', 'notes', profile?.website_active ? 'payment' : 'contract'].map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab as any)}
                className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-[#c4d82e] text-[#c4d82e]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab === 'websites' && 'Meus Sites'}
                {tab === 'statistics' && 'Estatísticas'}
                {tab === 'details' && 'Detalhes'}
                {tab === 'notes' && 'Notas'}
                {tab === 'payment' && 'Pagamento'}
                {tab === 'contract' && 'Contratar'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Websites Tab */}
        {activeTab === 'websites' && (
          <div>
            {websites.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Nenhum website registrado</h3>
                <p className="text-gray-400 mb-6">Adicione seu primeiro website para começar</p>
                <button
                  onClick={() => {
                    setShowAddModal(true);
                    resetForm();
                  }}
                  className="bg-[#c4d82e] text-black px-6 py-3 rounded-lg font-bold hover:bg-[#b5c928] transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Website
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {websites.map(website => (
                  <div
                    key={website.id}
                    className="group relative bg-[#2a2a2a] rounded-xl border border-gray-800 hover:border-[#c4d82e]/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#c4d82e]/10 cursor-pointer"
                    onClick={() => handleSelectWebsite(website)}
                  >
                    {/* Status Indicator */}
                    {website.status === 'active' && (
                      <div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    )}

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-[#c4d82e]/20 rounded-lg flex items-center justify-center">
                          <Globe className="w-6 h-6 text-[#c4d82e]" />
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditWebsite(website);
                            }}
                            className="p-2 bg-[#c4d82e]/20 hover:bg-[#c4d82e]/40 rounded-lg text-[#c4d82e] transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWebsite(website.id);
                            }}
                            className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-500 transition-colors"
                            title="Deletar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2 truncate">
                        {website.site_name}
                      </h3>

                      {website.site_link && (
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3 truncate">
                          <LinkIcon className="w-4 h-4 text-[#c4d82e] flex-shrink-0" />
                          <a
                            href={website.site_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[#c4d82e] transition-colors truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {website.site_link}
                          </a>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-4">
                        {website.domain_login && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#c4d82e]/10 text-[#c4d82e] text-xs rounded-full">
                            <Key className="w-3 h-3" />
                            Credenciais
                          </span>
                        )}
                        {website.github_link && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full">
                            <Github className="w-3 h-3" />
                            GitHub
                          </span>
                        )}
                        {website.hosting_data && Object.values(website.hosting_data).some(v => v) && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full">
                            <Database className="w-3 h-3" />
                            Hospedagem
                          </span>
                        )}
                        {website.social_links && website.social_links.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-full">
                            <LinkIcon className="w-3 h-3" />
                            Redes Sociais
                          </span>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
                        Criado em {new Date(website.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm font-medium mb-2">Total de Websites</div>
                <div className="text-4xl font-bold text-[#c4d82e]">{websites.length}</div>
              </div>
              <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm font-medium mb-2">Websites Ativos</div>
                <div className="text-4xl font-bold text-green-500">
                  {websites.filter(w => w.status === 'active').length}
                </div>
              </div>
              <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm font-medium mb-2">Com Credenciais</div>
                <div className="text-4xl font-bold text-blue-400">
                  {websites.filter(w => w.domain_login).length}
                </div>
              </div>
              <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-800">
                <div className="text-gray-400 text-sm font-medium mb-2">Com GitHub</div>
                <div className="text-4xl font-bold text-purple-400">
                  {websites.filter(w => w.github_link).length}
                </div>
              </div>
            </div>

            <div className="bg-[#2a2a2a] rounded-xl p-6 border border-gray-800">
              <h3 className="text-xl font-bold text-white mb-6">Resumo por Status</h3>
              <div className="space-y-4">
                {websites.map(website => (
                  <div key={website.id} className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg hover:bg-[#252525] transition-colors">
                    <div>
                      <h4 className="font-bold text-white">{website.site_name}</h4>
                      <p className="text-sm text-gray-400">
                        Criado em {new Date(website.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-lg font-medium ${
                      website.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-700/30 text-gray-400'
                    }`}>
                      {website.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Details Tab - READ ONLY VIEW OF ALL DATA */}
        {activeTab === 'details' && (
          <div>
            {selectedWebsite ? (
              <div className="bg-[#2a2a2a] rounded-xl border border-gray-800 p-8 max-w-4xl">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white">Detalhes - {selectedWebsite.site_name}</h2>
                  <button
                    onClick={() => setSelectedWebsite(null)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* INFORMAÇÕES BÁSICAS - READ ONLY */}
                <div className="space-y-6">
                  {/* Nicho/Segmento */}
                  <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
                    <label className="text-gray-400 text-sm block mb-2">Nicho/Segmento</label>
                    <p className="text-white font-mono text-lg">{selectedWebsite.site_name || '-'}</p>
                  </div>

                  {/* Link do Website */}
                  {selectedWebsite.site_link && (
                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
                      <label className="text-gray-400 text-sm block mb-2 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-[#c4d82e]" />
                        Link do Website
                      </label>
                      <a
                        href={selectedWebsite.site_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#c4d82e] hover:text-[#b5c928] break-all font-mono"
                      >
                        {selectedWebsite.site_link}
                      </a>
                    </div>
                  )}

                  {/* Nome do Serviço */}
                  {(selectedWebsite as any).service_name && (
                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
                      <label className="text-gray-400 text-sm block mb-2">Nome do Serviço</label>
                      <p className="text-white font-mono">{(selectedWebsite as any).service_name}</p>
                    </div>
                  )}

                  {/* Credenciais do Domínio */}
                  {(selectedWebsite.domain_login || selectedWebsite.domain_password || (selectedWebsite as any).domain_registrar) && (
                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
                      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Key className="w-4 h-4 text-[#c4d82e]" />
                        Credenciais do Domínio
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-gray-400 text-sm">Provedor de dominio:</label>
                          <p className="text-white font-mono mt-1">{(selectedWebsite as any).domain_registrar || '-'}</p>
                        </div>
                        {selectedWebsite.domain_login && (
                          <div>
                            <label className="text-gray-400 text-sm">Email/Login:</label>
                            <p className="text-white font-mono mt-1">{selectedWebsite.domain_login}</p>
                          </div>
                        )}
                        {selectedWebsite.domain_password && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-gray-400 text-sm">Senha:</label>
                              <button
                                onClick={() => setShowPasswordFields({ ...showPasswordFields, [selectedWebsite.id]: !showPasswordFields[selectedWebsite.id] })}
                                className="text-[#c4d82e] hover:text-[#b5c928] text-sm flex items-center gap-1"
                              >
                                {showPasswordFields[selectedWebsite.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            <p className="text-white font-mono mt-1">{showPasswordFields[selectedWebsite.id] ? selectedWebsite.domain_password : '••••••••'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Link GitHub */}
                  {selectedWebsite.github_link && (
                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
                      <label className="text-gray-400 text-sm block mb-2 flex items-center gap-2">
                        <Github className="w-4 h-4 text-[#c4d82e]" />
                        Link do GitHub
                      </label>
                      <a
                        href={selectedWebsite.github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#c4d82e] hover:text-[#b5c928] break-all font-mono"
                      >
                        {selectedWebsite.github_link}
                      </a>
                    </div>
                  )}

                  {/* Dados de Hospedagem */}
                  {selectedWebsite.hosting_data && Object.values(selectedWebsite.hosting_data).some(v => v) && (
                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
                      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#c4d82e]" />
                        Dados de Hospedagem
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedWebsite.hosting_data.provider && (
                          <div>
                            <label className="text-gray-400 text-sm">Provedor</label>
                            <p className="text-white font-mono mt-1">{selectedWebsite.hosting_data.provider}</p>
                          </div>
                        )}
                        {selectedWebsite.hosting_data.host && (
                          <div>
                            <label className="text-gray-400 text-sm">Host/Domínio</label>
                            <p className="text-white font-mono mt-1">{selectedWebsite.hosting_data.host}</p>
                          </div>
                        )}
                        {selectedWebsite.hosting_data.plan && (
                          <div>
                            <label className="text-gray-400 text-sm">Plano</label>
                            <p className="text-white font-mono mt-1">{selectedWebsite.hosting_data.plan}</p>
                          </div>
                        )}
                        {selectedWebsite.hosting_data.account && (
                          <div>
                            <label className="text-gray-400 text-sm">Conta/Usuário</label>
                            <p className="text-white font-mono mt-1">{selectedWebsite.hosting_data.account}</p>
                          </div>
                        )}
                      </div>
                      {selectedWebsite.hosting_data.notes && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <label className="text-gray-400 text-sm">Notas de Hospedagem</label>
                          <p className="text-white mt-2 whitespace-pre-wrap">{selectedWebsite.hosting_data.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notas */}
                  {(selectedWebsite as any).notes && (
                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-700">
                      <h3 className="text-white font-bold mb-3">Notas</h3>
                      <p className="text-white whitespace-pre-wrap">{(selectedWebsite as any).notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Selecione um website</h3>
                <p className="text-gray-400">Clique em um website na aba "Meus Sites" para ver seus detalhes completos</p>
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div>
            {selectedWebsite ? (
              <div className="bg-[#2a2a2a] rounded-xl border border-gray-800 p-8 max-w-4xl">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white">
                    Notas - {selectedWebsite.site_name}
                  </h2>
                  <button
                    onClick={() => setSelectedWebsite(null)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Social Links */}
                  <div className="border-b border-gray-700 pb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-[#c4d82e]" />
                        Redes Sociais
                      </h3>
                      <button
                        onClick={addSocialLink}
                        className="bg-[#c4d82e]/20 hover:bg-[#c4d82e]/40 text-[#c4d82e] px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar
                      </button>
                    </div>

                    {formData.social_links.length === 0 ? (
                      <p className="text-gray-400 text-sm">Nenhuma rede social adicionada</p>
                    ) : (
                      <div className="space-y-3">
                        {formData.social_links.map((link, index) => (
                          <div key={index} className="flex gap-3">
                            <input
                              type="text"
                              placeholder="Plataforma (Instagram, Facebook, LinkedIn...)"
                              value={link.platform}
                              onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                              className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                            />
                            <input
                              type="url"
                              placeholder="URL"
                              value={link.url}
                              onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                              className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                            />
                            <button
                              onClick={() => removeSocialLink(index)}
                              className="bg-red-500/20 hover:bg-red-500/40 text-red-500 px-4 py-3 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Photos */}
                  <div className="border-b border-gray-700 pb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold flex items-center gap-2">
                        <Images className="w-4 h-4 text-[#c4d82e]" />
                        Fotos do Website
                      </h3>
                      <button
                        onClick={addPhotoLink}
                        className="bg-[#c4d82e]/20 hover:bg-[#c4d82e]/40 text-[#c4d82e] px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar
                      </button>
                    </div>

                    {formData.site_photos.length === 0 ? (
                      <p className="text-gray-400 text-sm">Nenhuma foto adicionada</p>
                    ) : (
                      <div className="space-y-3">
                        {formData.site_photos.map((photo, index) => (
                          <div key={index} className="flex gap-3">
                            <input
                              type="url"
                              placeholder="URL da foto"
                              value={photo.url}
                              onChange={(e) => updatePhotoLink(index, 'url', e.target.value)}
                              className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                            />
                            <input
                              type="text"
                              placeholder="Nome/Descrição (opcional)"
                              value={photo.name || ''}
                              onChange={(e) => updatePhotoLink(index, 'name', e.target.value)}
                              className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                            />
                            <button
                              onClick={() => removePhotoLink(index)}
                              className="bg-red-500/20 hover:bg-red-500/40 text-red-500 px-4 py-3 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* General Notes */}
                  <div>
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#c4d82e]" />
                      Notas Gerais
                    </h3>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Adicione notas importantes sobre este website..."
                      rows={6}
                      className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex gap-4 pt-6 border-t border-gray-700">
                    <button
                      onClick={handleUpdateWebsite}
                      className="flex-1 bg-[#c4d82e] text-black px-6 py-3 rounded-lg font-bold hover:bg-[#b5c928] transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      Salvar Notas
                    </button>
                    <button
                      onClick={() => setSelectedWebsite(null)}
                      className="flex-1 bg-gray-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Selecione um website</h3>
                <p className="text-gray-400">Clique em um website na aba "Meus Sites" para adicionar notas, fotos e links de redes sociais</p>
              </div>
            )}
          </div>
        )}

        {/* Contract Tab */}
        {activeTab === 'contract' && (
          <div className="text-center py-16">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <Globe className="w-24 h-24 text-[#c4d82e] mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">Contratar Desenvolvimento de Sites</h2>
                <p className="text-gray-400 text-lg mb-8">
                  Adquira o serviço de desenvolvimento de websites profissionais. Pagamento único e sem recorrência.
                </p>
              </div>

              <div className="bg-[#2a2a2a] rounded-xl border border-gray-800 p-8 mb-8 max-w-md mx-auto">
                <h3 className="text-white font-bold text-xl mb-6">Plano Desenvolvimento de Sites</h3>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#c4d82e]" />
                    <span className="text-gray-300">Site profissional customizado</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#c4d82e]" />
                    <span className="text-gray-300">Hospedagem incluída</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#c4d82e]" />
                    <span className="text-gray-300">Design responsivo</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#c4d82e]" />
                    <span className="text-gray-300">Suporte completo</span>
                  </div>
                </div>
                <div className="text-4xl font-bold text-[#c4d82e] mb-8">
                  {websitePlan ? formatPrice(websitePlan.monthly_price) : 'R$ 1.490'}
                </div>
                <button
                  onClick={() => window.location.href = '/direct-payment?plan=website'}
                  className="w-full bg-[#c4d82e] text-black px-6 py-4 rounded-lg font-bold hover:bg-[#b5c928] transition-colors flex items-center justify-center gap-2 text-lg"
                >
                  Contratar Agora
                </button>
              </div>

              <p className="text-gray-500 text-sm">
                Clique em "Contratar Agora" para proceder com o pagamento via PIX ou Cartão de Crédito
              </p>
            </div>
          </div>
        )}

        {/* Payment Tab */}
        {activeTab === 'payment' && profile?.website_active && (
          <div className="text-center py-16">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <Check className="w-24 h-24 text-green-500 mx-auto mb-6 animate-pulse" />
                <h2 className="text-3xl font-bold text-white mb-4">Serviço Contratado com Sucesso!</h2>
                <p className="text-gray-400 text-lg mb-8">
                  Seu plano de desenvolvimento de websites foi ativado com sucesso.
                </p>
              </div>

              <div className="bg-[#2a2a2a] rounded-xl border border-gray-800 p-8 mb-8 max-w-md mx-auto">
                <h3 className="text-white font-bold text-xl mb-6">Informações do Pagamento</h3>
                <div className="space-y-6">
                  {/* Data/Hora */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-[#c4d82e]" />
                      <span className="text-gray-400">Data/Hora</span>
                    </div>
                    <span className="text-white font-bold">
                      {profile?.website_activation_date 
                        ? new Date(profile.website_activation_date).toLocaleString('pt-BR')
                        : 'N/A'
                      }
                    </span>
                  </div>

                  {/* Valor */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-[#c4d82e]" />
                      <span className="text-gray-400">Valor</span>
                    </div>
                    <span className="text-white font-bold text-xl">
                      {websitePlan ? formatPrice(websitePlan.monthly_price) : 'R$ 1.490'}
                    </span>
                  </div>

                  {/* Plano */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-[#c4d82e]" />
                      <span className="text-gray-400">Plano</span>
                    </div>
                    <span className="text-white font-bold">
                      {websitePlan?.name || 'Desenvolvimento de Websites'}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-700 my-6"></div>

                {/* Status */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className="text-green-400 font-bold flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" />
                    Serviço Ativo
                  </p>
                </div>
              </div>

              <p className="text-gray-500 text-sm">
                Você receberá um e-mail com os detalhes do seu serviço
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#2a2a2a] rounded-xl border border-gray-800 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Novo Website</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-bold mb-2">Segmento</label>
                <input
                  type="text"
                  value={formData.site_name}
                  onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                  placeholder="Ex: E-commerce, Blog, Portfólio"
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">Link do Website</label>
                <input
                  type="url"
                  value={formData.site_link}
                  onChange={(e) => setFormData({ ...formData, site_link: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                />
              </div>

              <div className="flex gap-4 mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={handleAddWebsite}
                  className="flex-1 bg-[#c4d82e] text-black px-6 py-3 rounded-lg font-bold hover:bg-[#b5c928] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Website
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-600 transition-colors"
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
