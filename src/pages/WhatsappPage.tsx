import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Bot, Play, Square, ArrowLeft, Wifi, WifiOff, MessageSquare, CheckCircle, RotateCcw, X, Zap, Settings2, Brain, MessageCircle, TestTube, Save, Eye, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useWhatsAppConnection } from '../hooks/useWhatsAppConnection';
import { useUserProfile } from '../hooks/useUserProfile';
import { supabase } from '../lib/supabase';

// Adicionar estilos CSS customizados para animações e componentes
const customStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(34, 211, 238, 0.3); }
    50% { box-shadow: 0 0 40px rgba(34, 211, 238, 0.6), 0 0 60px rgba(34, 211, 238, 0.4); }
  }

  .animation-delay-100 { animation-delay: 0.1s; }
  .animation-delay-200 { animation-delay: 0.2s; }
  .animation-delay-300 { animation-delay: 0.3s; }
  .animation-delay-500 { animation-delay: 0.5s; }

  .futuristic-glow {
    animation: glow 2s ease-in-out infinite;
  }

  .float-animation {
    animation: float 3s ease-in-out infinite;
  }

  /* Custom slider styles */
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #8b5cf6, #3b82f6);
    cursor: pointer;
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
    transition: all 0.2s ease;
  }

  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.8);
  }

  .slider::-moz-range-thumb {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #8b5cf6, #3b82f6);
    cursor: pointer;
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
    border: none;
    transition: all 0.2s ease;
  }

  .slider::-moz-range-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.8);
  }

  /* Custom checkbox styles */
  input[type="checkbox"] {
    accent-color: #dc2626;
  }

  /* Hide scrollbar */
  .scrollbar-hide {
    -ms-overflow-style: none;  /* Internet Explorer 10+ */
    scrollbar-width: none;  /* Firefox */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Safari and Chrome */
  }

  /* Custom select dropdown styling */
  select {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }

  /* Style the dropdown options */
  select option {
    background-color: #1f2937 !important;
    color: white !important;
    padding: 8px;
  }

  select optgroup {
    background-color: #374151 !important;
    color: #9ca3af !important;
    font-weight: bold;
    padding: 4px 8px;
  }

  /* Webkit browsers (Chrome, Safari, Edge) */
  select::-webkit-listbox {
    background-color: #1f2937 !important;
  }

  select::-webkit-listbox option {
    background-color: #1f2937 !important;
    color: white !important;
    padding: 8px 12px;
  }

  select::-webkit-listbox optgroup {
    background-color: #374151 !important;
    color: #9ca3af !important;
    font-weight: bold;
    padding: 4px 12px;
  }

  /* Firefox */
  select:-moz-listbox {
    background-color: #1f2937 !important;
  }

  select:-moz-listbox option {
    background-color: #1f2937 !important;
    color: white !important;
  }

  select:-moz-listbox optgroup {
    background-color: #374151 !important;
    color: #9ca3af !important;
    font-weight: bold;
  }

  /* Force dark background for all select elements */
  select, select:focus, select:active, select:hover {
    background-color: #1f2937 !important;
    background: linear-gradient(135deg, #1f2937 0%, #374151 100%) !important;
  }
`;

// Injetar estilos no head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

interface WhatsappPageProps {
  onBack: () => void;
  isSchedulerMode?: boolean; // Nova prop para identificar se está no modo scheduler
}

type Tab = 'connection' | 'configure' | 'test';

const WhatsappPage: React.FC<WhatsappPageProps> = ({ onBack, isSchedulerMode = false }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('connection');
  const { connection, loading, error, actions } = useWhatsAppConnection();
  const { profile } = useUserProfile();

  const [authCode, setAuthCode] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [webhookValidated, setWebhookValidated] = useState(false);
  const [inputPhoneNumber, setInputPhoneNumber] = useState<string>('');
  const [qrTimer, setQrTimer] = useState<number>(30); // Aumentado para 30 segundos
  const [qrTimerActive, setQrTimerActive] = useState(false);
  const [connectionEstablished, setConnectionEstablished] = useState(false);
  const [workflowCreated, setWorkflowCreated] = useState(false);

  // Agent type selection - Scheduler mode shows only scheduling agent, Dashboard shows commercial/support/billing
  const [agentType, setAgentType] = useState<'commercial' | 'support' | 'billing' | 'scheduling'>(
    isSchedulerMode ? 'scheduling' : 'commercial'
  );

  // Agent configuration states
  const [agentPersonality, setAgentPersonality] = useState('');
  const [agentGreeting, setAgentGreeting] = useState('');
  const [companyKnowledge, setCompanyKnowledge] = useState('');
  const [servicesKnowledge, setServicesKnowledge] = useState('');
  const [aiTemperature, setAiTemperature] = useState(0.7);
  const [continuousLearning, setContinuousLearning] = useState(true);
  const [savingAgentConfig, setSavingAgentConfig] = useState(false);

  // Agent validation
  const [validatingPersonality, setValidatingPersonality] = useState(false);

  // Chat testing states
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    text: string;
    sender: 'user' | 'agent';
    timestamp: Date;
  }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [agentConfig, setAgentConfig] = useState<any>(null);

  // Chat templates management
  const [showTemplatesList, setShowTemplatesList] = useState(false);
  const [chatTemplates, setChatTemplates] = useState<Array<{
    id: string;
    name: string;
    messages: any[];
    created_at: string;
  }>>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Voice configuration - REMOVED for text-only responses
  // const [selectedVoice, setSelectedVoice] = useState('pt-BR-Neural2-A'); // Default voice

  // Audio recording states - REMOVED for text-only responses
  // const [isRecording, setIsRecording] = useState(false);
  // const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  // const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  // const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  // const [useWebSpeechAPI, setUseWebSpeechAPI] = useState(true); // Default to free Web Speech API

  // Voice options - REMOVED for text-only responses


  // Timer effect for QR Code modal
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let statusCheckInterval: NodeJS.Timeout;

    if (qrTimerActive) {
      // Timer countdown (only for display)
      interval = setInterval(() => {
        setQrTimer(prev => {
          const newTimer = prev - 1;
          // Don't close modal when timer reaches 0, just stop countdown
          if (newTimer <= 0) {
            setQrTimerActive(false);
            console.log('⏰ QR Code timer expired - modal stays open until connection or manual close');
          }
          return Math.max(0, newTimer);
        });
      }, 1000);

      // Check connection status every 3 seconds using check-waha-status
      statusCheckInterval = setInterval(async () => {
        try {
          console.log('🔄 Auto-checking WAHA status for connection...');

          // Use check-waha-status to sync WAHA and database status
          const result = await supabase.functions.invoke('check-waha-status', {
            body: { sessionName: 'default' }
          });

          if (result.error) {
            console.error('❌ Error in auto status check:', result.error);
            return;
          }

          const data = result.data;
          console.log('📊 Auto check result:', data);

          // If connection is established, close modal
          if (data.success && data.databaseStatus === 'connected') {
            console.log('✅ Auto check: Connection established! Closing QR modal.');
            setConnectionEstablished(true);
            setShowQrModal(false);
            setQrTimerActive(false);
            setQrTimer(30);
            return;
          }

          // If WAHA shows WORKING but database doesn't, update database
          if (data.success && data.wahaStatus === 'WORKING' && data.databaseStatus !== 'connected') {
            console.log('🔄 WAHA is WORKING but database not updated, forcing sync...');

            // Force another check to update database
            setTimeout(async () => {
              const syncResult = await supabase.functions.invoke('check-waha-status', {
                body: { sessionName: 'default' }
              });
              if (syncResult.data?.databaseStatus === 'connected') {
                console.log('✅ Sync successful, closing modal');
                setConnectionEstablished(true);
                setShowQrModal(false);
                setQrTimerActive(false);
                setQrTimer(30);
              }
            }, 1000);
          }
        } catch (error) {
          console.error('Error in auto status check:', error);
        }
      }, 3000); // Check every 3 seconds (less frequent to avoid overload)
    }

    return () => {
      if (interval) clearInterval(interval);
      if (statusCheckInterval) clearInterval(statusCheckInterval);
    };
  }, [qrTimerActive]); // Remove connection dependency to avoid unnecessary re-runs

  // Function to load agent configuration
  const loadAgentConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('agent_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_type', agentType)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading agent config:', error);
        return;
      }

      setAgentConfig(data);

      // Load form values from config (handle JSONB format)
      console.log('🔄 Loading form values from config:', {
        agent_type: data?.agent_type,
        personality: data?.personality,
        presentation: data?.presentation,
        company_knowledge: data?.company_knowledge,
        product_knowledge: data?.product_knowledge,
        ai_temperature: data?.technical_config?.ai_temperature,
        continuous_learning: data?.technical_config?.continuous_learning,
        n8n_webhook_url: data?.n8n_webhook_url
      });

      // Handle JSONB format: extract text from objects or use string directly
      if (data?.personality) {
        const personalityText = typeof data.personality === 'string' ? data.personality : data.personality?.text || '';
        setAgentPersonality(personalityText);
      }
      if (data?.presentation) {
        const presentationText = typeof data.presentation === 'string' ? data.presentation : data.presentation?.text || '';
        setAgentGreeting(presentationText);
      }
      if (data?.company_knowledge) {
        const companyText = typeof data.company_knowledge === 'string' ? data.company_knowledge : data.company_knowledge?.text || '';
        setCompanyKnowledge(companyText);
      }
      if (data?.product_knowledge) {
        const productText = typeof data.product_knowledge === 'string' ? data.product_knowledge : data.product_knowledge?.text || '';
        setServicesKnowledge(productText);
      }
      if (data?.technical_config?.ai_temperature) setAiTemperature(data.technical_config.ai_temperature);
      if (data?.technical_config?.continuous_learning !== undefined) setContinuousLearning(data.technical_config.continuous_learning);

      console.log('✅ Agent config loaded and form values set');
    } catch (error) {
      console.error('Error loading agent config:', error);
    }
  };

  // Function to send message to Gemini
  const sendMessageToGemini = async (message: string) => {
    try {
      console.log('🤖 Starting Gemini API call...');
      console.log('📋 Agent config available:', !!agentConfig);

      // Get user credentials (Gemini API key)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      console.log('👤 User authenticated:', user.id);

      const { data: credentials, error: credError } = await supabase
        .from('user_credentials')
        .select('gemini_api_key')
        .eq('user_id', user.id)
        .single();

      if (credError || !credentials?.gemini_api_key) {
        console.error('❌ Gemini API key error:', credError);
        throw new Error('API key do Gemini não encontrada. Configure suas credenciais primeiro.');
      }

      console.log('🔑 Gemini API key found');

      // Build comprehensive context from agent configuration
      let systemPrompt = '';

      if (agentConfig) {
        // Extract text from JSONB objects (handle both string and object formats)
        const personalityText = typeof agentConfig.personality === 'string'
          ? agentConfig.personality
          : agentConfig.personality?.text || '';

        const companyKnowledgeText = typeof agentConfig.company_knowledge === 'string'
          ? agentConfig.company_knowledge
          : agentConfig.company_knowledge?.text || '';

        const productKnowledgeText = typeof agentConfig.product_knowledge === 'string'
          ? agentConfig.product_knowledge
          : agentConfig.product_knowledge?.text || '';

        const presentationText = typeof agentConfig.presentation === 'string'
          ? agentConfig.presentation
          : agentConfig.presentation?.text || '';

        // Start with personality as base
        if (personalityText) {
          systemPrompt = personalityText;
        } else {
          systemPrompt = 'Você é um assistente de IA útil e amigável.';
        }

        // Add company knowledge
        if (companyKnowledgeText) {
          systemPrompt += `\n\n## SOBRE A EMPRESA\n${companyKnowledgeText}`;
        }

        // Add services/products knowledge
        if (productKnowledgeText) {
          systemPrompt += `\n\n## PRODUTOS E SERVIÇOS\n${productKnowledgeText}`;
        }

        // Add presentation/greeting context
        if (presentationText) {
          systemPrompt += `\n\n## APRESENTAÇÃO INICIAL\nQuando iniciar uma conversa, use esta apresentação: ${presentationText}`;
        }

        // Add chat templates as context
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: templates } = await supabase
              .from('chat_templates')
              .select('name, messages')
              .eq('user_id', user.id)
              .limit(5); // Limit to 5 most recent templates

            if (templates && templates.length > 0) {
              systemPrompt += `\n\n## EXEMPLOS DE CONVERSAS SALVAS\nUse estes exemplos como referência para o estilo e tom das respostas:\n`;
              templates.forEach((template, index) => {
                systemPrompt += `\n### Exemplo ${index + 1}: ${template.name}\n`;
                const messages = Array.isArray(template.messages) ? template.messages : [];
                messages.slice(0, 4).forEach((msg: any) => { // Limit to first 4 messages per template
                  systemPrompt += `${msg.sender === 'user' ? 'Cliente' : 'Agente'}: ${msg.text}\n`;
                });
              });
            }
          }
        } catch (error) {
          console.warn('Could not load chat templates for context:', error);
        }

        // Add agent type specific instructions
        const agentTypeInstructions: Record<string, string> = {
          commercial: `
## 🎯 INSTRUÇÕES PARA AGENTE COMERCIAL
- **Objetivo Principal**: Converter leads em agendamentos e vendas
- **Abordagem**: Seja persuasivo mas não agressivo, foque nos benefícios
- **Agendamentos**: Sempre tente agendar consultas quando apropriado
- **Produtos/Serviços**: Destaque valores agregados e promoções
- **Follow-up**: Mantenha contato para fechar vendas
- **Ferramentas**: Use ferramentas de agendamento para verificar disponibilidade`,

          support: `
## 🛠️ INSTRUÇÕES PARA AGENTE DE SUPORTE
- **Objetivo Principal**: Resolver problemas e garantir satisfação do cliente
- **Abordagem**: Seja paciente, empático e solucionador de problemas
- **Agendamentos**: Ofereça reagendamentos ou follow-ups quando necessário
- **Histórico**: Consulte histórico de agendamentos para contexto
- **Soluções**: Sugira soluções práticas e alternativas
- **Ferramentas**: Use ferramentas para verificar status de agendamentos`,

          billing: `
## 💰 INSTRUÇÕES PARA AGENTE DE COBRANÇA
- **Objetivo Principal**: Resolver pendências financeiras de forma educada
- **Abordagem**: Seja profissional, firme mas compreensivo
- **Pagamentos**: Verifique status de pagamentos e débitos pendentes
- **Negociações**: Ofereça opções de parcelamento quando apropriado
- **Agendamentos**: Consulte agendamentos relacionados a débitos
- **Ferramentas**: Use ferramentas para verificar status financeiro`,

          scheduling: `
## 📅 INSTRUÇÕES PARA AGENTE DE AGENDAMENTO
- **Objetivo Principal**: Gerenciar agendamentos de forma eficiente
- **Abordagem**: Seja organizado, proativo e focado em otimizar a agenda
- **Consultas**: Verifique disponibilidade e sugira horários alternativos
- **Reagendamentos**: Ofereça opções flexíveis para mudanças de horário
- **Confirmações**: Sempre confirme detalhes da consulta (data, horário, serviço)
- **Ferramentas**: Use ferramentas de agendamento para consultar e criar compromissos
- **Histórico**: Consulte histórico de agendamentos do cliente quando relevante

## 🛠️ FERRAMENTAS DISPONÍVEIS PARA AGENDAMENTOS:
- **getAvailableSlots**: Verificar horários disponíveis em uma data específica
- **getAppointments**: Consultar agendamentos existentes (por cliente, data, status)
- **createAppointment**: Criar novo agendamento com serviços e profissional
- **rescheduleAppointment**: Reagendar consulta existente
- **cancelAppointment**: Cancelar agendamento
- **getProfessionals**: Listar profissionais disponíveis
- **getServices**: Listar serviços oferecidos

## 📋 PROTOCOLO DE ATENDIMENTO:
1. **Identificar cliente**: Sempre pergunte nome e telefone para identificação
2. **Verificar histórico**: Consulte agendamentos anteriores do cliente
3. **Determinar serviço**: Pergunte qual serviço o cliente deseja
4. **Verificar disponibilidade**: Use getAvailableSlots para encontrar horários
5. **Criar agendamento**: Use createAppointment com todos os detalhes
6. **Confirmar detalhes**: Sempre confirme data, horário, serviço e profissional`
        };

        if (agentConfig.agent_type && agentTypeInstructions[agentConfig.agent_type]) {
          systemPrompt += agentTypeInstructions[agentConfig.agent_type];
        }

        // Add technical context
        if (agentConfig.technical_config) {
          systemPrompt += `\n\n## INSTRUÇÕES TÉCNICAS\n- Mantenha um tom de voz consistente com sua personalidade\n- Seja sempre útil e profissional\n- Use as informações da empresa e produtos para responder perguntas\n- Use os exemplos de conversas como referência para o estilo de resposta\n- Se não souber algo, admita e ofereça ajuda em outras áreas`;
        }
      } else {
        // Fallback when no configuration is saved
        systemPrompt = 'Você é um assistente de IA útil e amigável. Ajude o usuário da melhor forma possível.';
      }

      console.log('📝 System prompt built:', systemPrompt.substring(0, 200) + '...');
      console.log('💬 User message:', message);

      // Call Gemini API with 2.5 Flash model
      const requestBody = {
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUsuário: ${message}\n\nResponda de forma natural e útil:`
          }]
        }],
        generationConfig: {
          temperature: agentConfig?.technical_config?.ai_temperature || 0.7,
          maxOutputTokens: agentConfig?.technical_config?.max_tokens || 4096,
        }
      };

      console.log('🚀 Calling Gemini 2.5 Flash API...');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${credentials.gemini_api_key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error:', response.status, errorText);

        if (response.status === 429) {
          throw new Error('Limite de uso da API Gemini atingido. Aguarde alguns minutos ou faça upgrade do plano.');
        }

        throw new Error(`Erro na API do Gemini (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 Gemini response received');

      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!aiResponse) {
        console.warn('⚠️ No response text from Gemini');
        return 'Olá! Sou seu assistente virtual. Como posso ajudar você hoje?';
      }

      console.log('✅ AI Response generated:', aiResponse.substring(0, 100) + '...');

      return aiResponse;
    } catch (error) {
      console.error('💥 Error in sendMessageToGemini:', error);
      if (error instanceof Error) {
        throw new Error(`Erro na comunicação com Gemini: ${error.message}`);
      } else {
        throw new Error('Erro desconhecido na comunicação com Gemini');
      }
    }
  };

  // Function to send chat message
  const sendChatMessage = async () => {
    if (!chatInput.trim() || sendingMessage) return;

    // Ensure agent config is loaded before sending message
    if (!agentConfig) {
      console.log('🔄 Loading agent config before sending message...');
      await loadAgentConfig();
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const userMessage = {
      id: Date.now().toString(),
      text: chatInput.trim(),
      sender: 'user' as const,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setSendingMessage(true);

    try {
      console.log('🤖 Sending message to Gemini with config:', !!agentConfig);
      const aiResponse = await sendMessageToGemini(userMessage.text);

      const agentMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'agent' as const,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        sender: 'agent' as const,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setSendingMessage(false);
    }
  };

  // Function to load chat templates
  const loadChatTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data, error } = await supabase
        .from('chat_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading chat templates:', error);
        return;
      }

      setChatTemplates(data || []);
    } catch (error) {
      console.error('Error loading chat templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Function to delete a chat template
  const deleteChatTemplate = async (templateId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este modelo de conversa?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        console.error('Error deleting chat template:', error);
        alert('Erro ao excluir modelo de conversa');
        return;
      }

      // Reload templates
      await loadChatTemplates();
      alert('Modelo de conversa excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting chat template:', error);
      alert('Erro ao excluir modelo de conversa');
    }
  };

  // Function to load a chat template into the chat
  const loadChatTemplate = async (template: any) => {
    if (!Array.isArray(template.messages)) {
      alert('Este modelo não contém mensagens válidas');
      return;
    }

    // Confirm before loading
    if (!window.confirm(`Carregar o modelo "${template.name}" no chat? Isso substituirá a conversa atual.`)) {
      return;
    }

    try {
      // Load messages into chat
      setChatMessages(template.messages.map((msg: any) => ({
        id: msg.id || Date.now().toString() + Math.random(),
        text: msg.text || '',
        sender: msg.sender || 'user',
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
      })));

      // Clear input
      setChatInput('');

      alert(`Modelo "${template.name}" carregado com sucesso!`);
    } catch (error) {
      console.error('Error loading chat template:', error);
      alert('Erro ao carregar modelo de conversa');
    }
  };

  // Load agent config when component mounts, when tab changes to test, and when agent type changes
  useEffect(() => {
    loadAgentConfig();
  }, []);

  useEffect(() => {
    if (activeTab === 'test') {
      loadAgentConfig();
    }
  }, [activeTab]);

  // Reload agent config when agent type changes
  useEffect(() => {
    loadAgentConfig();
  }, [agentType]);

  // Redirect to connection tab if trying to access blocked tabs without WhatsApp connected
  useEffect(() => {
    console.log('🔍 [DEBUG] Connection status check:', {
      activeTab,
      waha_status: connection?.waha_status,
      fullConnection: connection
    });

    if ((activeTab === 'configure' || activeTab === 'test') && connection?.waha_status !== 'connected') {
      console.log('🚫 [DEBUG] Redirecting to connection tab - WhatsApp not connected');
      setActiveTab('connection');
    }
  }, [activeTab, connection?.waha_status]);

  // Audio functions - REMOVED for text-only responses

  // Function to handle manual modal close
  const handleQrModalClose = () => {
    console.log('👤 [QR-MODAL] Usuário fechou modal QR manualmente, verificando status...');
    console.log('📊 [QR-MODAL] Status atual da conexão:', connection?.waha_status);

    // Close modal first
    setShowQrModal(false);
    setQrTimerActive(false);
    setQrTimer(30);
    console.log('🔒 [QR-MODAL] Modal fechado, timer parado');

    // If status is still 'connecting', it means user didn't authenticate
    // So we need to clean up the session
    if (connection?.waha_status === 'connecting') {
      console.log('⚠️ [QR-MODAL] Status ainda conectando, limpando sessão WAHA...');

      // Reset status by calling the reset function
      supabase.functions.invoke('reset-whatsapp-status', {
        body: { sessionName: 'default' }
      }).then((result) => {
        console.log('📡 [QR-MODAL] Resposta da função reset:', result);
        if (result.error) {
          console.error('❌ [QR-MODAL] Erro ao resetar status:', result.error);
        } else {
          console.log('✅ [QR-MODAL] Status do WhatsApp resetado após fechamento manual');
        }
      }).catch((error) => {
        console.error('❌ [QR-MODAL] Erro ao chamar função reset:', error);
      });
    } else if (connection?.waha_status === 'connected') {
      console.log('✅ [QR-MODAL] Status conectado, mantendo sessão ativa');
    } else {
      console.log('ℹ️ [QR-MODAL] Status não é connecting nem connected:', connection?.waha_status);
    }
  };


  // Function to save agent configuration
  const saveAgentConfiguration = async () => {
    try {
      setSavingAgentConfig(true);
      console.log('💾 [AGENT-CONFIG] Iniciando salvamento da configuração do agente...');

      // Debug: Log current form values
      console.log('📝 [AGENT-CONFIG] Valores atuais do formulário:', {
        agentPersonality: agentPersonality.substring(0, 100) + '...',
        agentGreeting: agentGreeting.substring(0, 100) + '...',
        companyKnowledge: companyKnowledge.substring(0, 100) + '...',
        servicesKnowledge: servicesKnowledge.substring(0, 100) + '...',
        aiTemperature,
        continuousLearning
      });

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ [AGENT-CONFIG] Usuário não autenticado:', userError);
        throw new Error('Usuário não autenticado');
      }

      console.log('👤 [AGENT-CONFIG] Usuário autenticado:', user.id);

      // Prepare data in N8N-compatible format (JSONB format for database)
       const agentConfig = {
         user_id: user.id,
         agent_type: agentType, // Tipo de agente correto baseado na seleção
         personality: agentPersonality.trim() ? { text: agentPersonality.trim(), enabled: true } : null,
         presentation: agentGreeting.trim() ? { text: agentGreeting.trim(), enabled: true } : null,
         company_knowledge: companyKnowledge.trim() ? { text: companyKnowledge.trim(), enabled: true } : null,
         product_knowledge: servicesKnowledge.trim() ? { text: servicesKnowledge.trim(), enabled: true } : null,
         personality_validated: false, // Reset validation when config is saved
         technical_config: {
           ai_temperature: aiTemperature,
           continuous_learning: continuousLearning,
           max_tokens: null, // No limit as requested
           model: 'gemini-2.5-flash',
           response_type: 'text', // Text-only responses
           updated_at: new Date().toISOString()
         },
         updated_at: new Date().toISOString()
       };

      console.log('📦 [AGENT-CONFIG] Configuração do agente a salvar:', {
        user_id: agentConfig.user_id,
        hasPersonality: !!agentConfig.personality,
        hasPresentation: !!agentConfig.presentation,
        hasCompanyKnowledge: !!agentConfig.company_knowledge,
        hasProductKnowledge: !!agentConfig.product_knowledge,
        technical_config: agentConfig.technical_config
      });

      // Validate that we have some data to save
      const hasData = agentPersonality.trim() || agentGreeting.trim() || companyKnowledge.trim() || servicesKnowledge.trim();
      console.log('📊 Has data to save:', hasData, {
        personality: !!agentPersonality.trim(),
        greeting: !!agentGreeting.trim(),
        company: !!companyKnowledge.trim(),
        services: !!servicesKnowledge.trim()
      });

      // Save to Supabase - upsert based on user_id and agent_type
      const result = await supabase
        .from('agent_configs')
        .upsert(agentConfig, {
          onConflict: 'user_id,agent_type'
        })
        .select();

      const { data, error } = result;

      if (error) {
        console.error('❌ Error saving agent config:', error);
        throw new Error('Erro ao salvar configuração do agente');
      }

      console.log('✅ Agent configuration saved successfully:', data);
      alert('Configuração do agente salva com sucesso!');

    } catch (error) {
      console.error('💥 Error saving agent configuration:', error);
      alert(`Erro ao salvar configuração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSavingAgentConfig(false);
    }
  };

  const handleWAHAAction = async (action: keyof typeof actions, params?: any) => {
    try {
      console.log(`🚀 Starting ${action}...`, params);

      // Para cloneN8NWorkflow, adicionar o parâmetro isSchedulerMode
      if (action === 'cloneN8NWorkflow') {
        params = { ...params, isSchedulerMode };
      }

      const result = await actions[action](params);
      // Log result without sensitive URLs
      const safeResult = { ...result };
      if (safeResult.workflow) {
        safeResult.workflow = { ...safeResult.workflow };
        delete safeResult.workflow.webhookUrl;
      }
      console.log(`📦 Result from ${action}:`, safeResult);

      // Se for connectWAHA e retornar código de autenticação, mostrar modal
      if (action === 'connectWAHA') {
        console.log('🔍 Checking for auth response:', result);

        // Se já está autenticado
        if (result?.alreadyAuthenticated) {
          console.log('✅ User already authenticated!');
          alert('WhatsApp já está conectado! Você pode continuar para os próximos passos.');
          return;
        }

        // Se retornou QR Code
        if (result?.qrCode) {
          console.log('✅ QR Code found, showing modal');

          // Processar QR Code para formato compatível
          let processedQrCode = result.qrCode;
          if (processedQrCode.startsWith('data:image')) {
            // Já é data URL completa
          } else if (processedQrCode.startsWith('iVBOR')) {
            // Base64 puro, adicionar prefixo
            processedQrCode = `data:image/png;base64,${processedQrCode}`;
          }
          // Se for string QR, manter como está (fallback)

          setQrCode(processedQrCode);
          setPhoneNumber(result.phoneNumber);
          setShowQrModal(true);
          // Start the 30-second timer
          setQrTimerActive(true);
          setQrTimer(30);
          setConnectionEstablished(false);
        } else {
          console.log('❌ No QR code in response');
          alert('QR Code não foi gerado. Verifique se o servidor está funcionando e tente novamente.');
        }
      }

      // Se for configureN8NWebhook e sucesso, marcar como validado
      if (action === 'configureN8NWebhook' && result?.success) {
        setWebhookValidated(true);
        console.log('✅ Webhook N8N configurado com sucesso no WAHA');
      }

      // Se for connectWAHA e sucesso, salvar URL do WAHA no Supabase
      if (action === 'connectWAHA' && result?.success) {
        console.log('💾 Salvando URL do WAHA no Supabase...');
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            console.error('❌ Erro ao obter usuário:', userError);
            return;
          }

          // Buscar configuração atual do agente
          const { data: currentConfig, error: fetchError } = await supabase
            .from('agent_configs')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('❌ Erro ao buscar configuração atual:', fetchError);
            return;
          }

          // Usar valores padrão do WAHA (podem ser configurados pelo usuário depois)
          const wahaUrl = 'http://whats.kitoai.online:3001';
          const wahaApiKey = '1261a25254e14a0493a9fb448f343cfd';

          const configUpdate = {
            user_id: user.id,
            waha_url: wahaUrl,
            waha_api_key: wahaApiKey,
            updated_at: new Date().toISOString()
          };

          const { error: updateError } = await supabase
            .from('agent_configs')
            .upsert(configUpdate, {
              onConflict: 'user_id'
            });

          if (updateError) {
            console.error('❌ Erro ao salvar URL do WAHA:', updateError);
          } else {
            console.log('✅ URL do WAHA salva no Supabase:', wahaUrl);
          }
        } catch (error) {
          console.error('❌ Erro ao salvar URL do WAHA:', error);
        }
      }

      // Se for cloneN8NWorkflow e sucesso, mostrar confirmação
      if (action === 'cloneN8NWorkflow' && result?.success) {
        setWorkflowCreated(true);
        setTimeout(() => setWorkflowCreated(false), 3000); // Esconder após 3 segundos
      }

      // Se for disconnectWAHA, limpar estados locais
      if (action === 'disconnectWAHA') {
        console.log('🧹 [DISCONNECT] Cleaning up local states...');
        setWebhookValidated(false);
        setWorkflowCreated(false);
        setConnectionEstablished(false);
        setQrCode(null);
        setPhoneNumber('');
        setInputPhoneNumber('');
        setShowQrModal(false);
        setQrTimerActive(false);
        setQrTimer(30);
        console.log('✅ [DISCONNECT] Local states cleaned successfully');
      }
    } catch (err) {
      console.error(`💥 Error in ${action}:`, err);
      alert(`Erro na operação ${action}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar ao Dashboard</span>
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isSchedulerMode ? 'Agente de WhatsApp' : 'Agente Modelo de WhatsApp'}
            </h1>
            <p className="text-gray-400">
              {isSchedulerMode
                ? 'Configure seu agente inteligente de WhatsApp'
                : 'Configure e gerencie seu agente modelo de WhatsApp'
              }
            </p>
          </div>

          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl">
           <div className="border-b border-white/10">
             <nav className="flex">
               <button
                 onClick={() => setActiveTab('connection')}
                 className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                   activeTab === 'connection'
                     ? 'border-[#c4d82e] text-[#c4d82e]'
                     : 'border-transparent text-gray-400 hover:text-white'
                 }`}
               >
                 Conexão WhatsApp
               </button>
               <button
                 onClick={() => {
                   console.log('🔍 [DEBUG] Configure tab clicked, status:', connection?.waha_status);
                   if (connection?.waha_status === 'connected') {
                     setActiveTab('configure');
                   } else {
                     alert('Conecte o WhatsApp primeiro para configurar o agente.');
                   }
                 }}
                 disabled={connection?.waha_status !== 'connected'}
                 className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                   connection?.waha_status !== 'connected'
                     ? 'opacity-50 cursor-not-allowed text-gray-500'
                     : activeTab === 'configure'
                     ? 'border-[#c4d82e] text-[#c4d82e]'
                     : 'border-transparent text-gray-400 hover:text-white'
                 }`}
               >
                 Configurar Agente
               </button>
               <button
                 onClick={() => {
                   console.log('🔍 [DEBUG] Test tab clicked, status:', connection?.waha_status);
                   if (connection?.waha_status === 'connected') {
                     setActiveTab('test');
                   } else {
                     alert('Conecte o WhatsApp primeiro para testar o agente.');
                   }
                 }}
                 disabled={connection?.waha_status !== 'connected'}
                 className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                   connection?.waha_status !== 'connected'
                     ? 'opacity-50 cursor-not-allowed text-gray-500'
                     : activeTab === 'test'
                     ? 'border-[#c4d82e] text-[#c4d82e]'
                     : 'border-transparent text-gray-400 hover:text-white'
                 }`}
               >
                 Testar Agente
               </button>
             </nav>
           </div>

          <div className="p-6">
            {activeTab === 'connection' && (
              <div className="space-y-6">
                {/* Passos de Configuração */}
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-8">
                  <div className="flex items-start mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0">
                      <Settings2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-3">
                        Passos para Configuração do Agente WhatsApp
                      </h3>
                      <p className="text-gray-300 mb-6 leading-relaxed">
                        Siga os passos abaixo para configurar completamente seu agente de WhatsApp com IA
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Passo 1 */}
                    <div
                      className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-blue-500/40 rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 animate-fade-in-up"
                      style={{ animationDelay: '0ms' }}
                    >
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/10">
                          <span className="text-blue-400 font-bold text-2xl">1</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">Validar acesso ao servidor</h4>
                        </div>
                      </div>
                    </div>

                    {/* Passo 2 */}
                    <div
                      className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-green-500/40 rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-2 animate-fade-in-up"
                      style={{ animationDelay: '100ms' }}
                    >
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/10">
                          <span className="text-green-400 font-bold text-2xl">2</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">Autenticar WhatsApp por QR Code</h4>
                        </div>
                      </div>
                    </div>

                    {/* Passo 3 */}
                    <div
                      className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-orange-500/40 rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2 animate-fade-in-up"
                      style={{ animationDelay: '200ms' }}
                    >
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/10">
                          <span className="text-orange-400 font-bold text-2xl">3</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">Criar fluxo do agente</h4>
                        </div>
                      </div>
                    </div>

                    {/* Passo 4 */}
                    <div
                      className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-purple-500/40 rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2 animate-fade-in-up"
                      style={{ animationDelay: '300ms' }}
                    >
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/10">
                          <span className="text-purple-400 font-bold text-2xl">4</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">Validar fluxo</h4>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controle do Agente */}
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-2xl flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Controle do Agente</h3>
                      <p className="text-gray-400 text-sm">Gerencie sua conexão e automações</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Estado 1: Sempre mostrar "Validar Servidor" se não estiver conectado */}
                      {(!connection || connection?.waha_status !== 'connected') && (
                        <div className="group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 transition-all duration-500 ease-out hover:scale-105 hover:shadow-xl hover:shadow-white/10">
                          <button
                            onClick={() => handleWAHAAction('validateWAHA')}
                            disabled={loading}
                            className="w-full flex flex-col items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <CheckCircle className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="text-center">
                              <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">Validar Servidor</span>
                              <p className="text-xs text-gray-400 mt-1">Verificar conexão WAHA</p>
                            </div>
                          </button>
                        </div>
                      )}

                      {/* Estado 1.5: WhatsApp já conectado - Mostrar status */}
                      {connection?.waha_status === 'connected' && connection?.waha_session_name && (
                        <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-6 transition-all duration-500 ease-out hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/10">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <CheckCircle className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div className="text-center">
                              <span className="text-sm font-semibold text-white">WhatsApp Conectado</span>
                              <p className="text-xs text-emerald-400 mt-1">Sessão ativa e funcionando</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleWAHAAction('disconnectWAHA')}
                            disabled={loading}
                            className="w-full mt-4 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-red-500/20 to-red-600/10 hover:from-red-500/30 hover:to-red-600/20 border border-red-500/30 hover:border-red-500/50 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-semibold text-red-300">Desconectar</span>
                          </button>
                        </div>
                      )}

                      {/* Estado 2: Servidor conectado, WhatsApp não conectado - Mostrar campo telefone + botão */}
                      {connection?.waha_status === 'connected' && !connection?.waha_session_name && (
                        <div className="group relative overflow-hidden bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6 transition-all duration-500 ease-out hover:scale-105 hover:shadow-xl hover:shadow-green-500/10">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3">
                              <label className="text-sm font-semibold text-white">
                                Número do WhatsApp
                              </label>
                              <input
                                type="tel"
                                value={inputPhoneNumber}
                                onChange={(e) => setInputPhoneNumber(e.target.value)}
                                placeholder="5511987654321"
                                className="px-4 py-3 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all"
                              />
                              <span className="text-xs text-gray-400">
                                Formato: 55 + DDD + número
                              </span>
                            </div>

                            <button
                              onClick={() => handleWAHAAction('connectWAHA', { phoneNumber: inputPhoneNumber })}
                              disabled={loading || !inputPhoneNumber.trim()}
                              className="w-full flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 hover:from-green-500/30 hover:to-green-600/20 border border-green-500/40 hover:border-green-500/60 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-green-500/30 to-green-600/20 rounded-lg flex items-center justify-center">
                                <Wifi className="w-4 h-4 text-green-400" />
                              </div>
                              <span className="text-sm font-semibold text-white text-center">Gerar QR Code</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Estado 3: Mostrar "Criar fluxo" se WhatsApp estiver conectado E houver sessão WAHA mas fluxo não criado */}
                      {connection?.waha_status === 'connected' && connection?.waha_session_name && (!connection?.n8n_status || connection?.n8n_status === 'not_created') && (
                        <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-2xl p-6 transition-all duration-500 ease-out hover:scale-105 hover:shadow-xl hover:shadow-orange-500/10">
                          <button
                            onClick={() => handleWAHAAction('cloneN8NWorkflow')}
                            disabled={loading || workflowCreated}
                            className="w-full flex flex-col items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              {loading ? (
                                <div className="w-6 h-6 border-2 border-orange-400 border-t-orange-600 rounded-full animate-spin"></div>
                              ) : workflowCreated ? (
                                <CheckCircle className="w-6 h-6 text-green-400" />
                              ) : (
                                <Bot className="w-6 h-6 text-orange-400" />
                              )}
                            </div>
                            <div className="text-center">
                              <span className="text-sm font-semibold text-white group-hover:text-orange-300 transition-colors">
                                {loading ? 'Criando fluxo...' : workflowCreated ? 'Fluxo Criado!' : 'Criar fluxo para o agente'}
                              </span>
                              <p className="text-xs text-gray-400 mt-1">Configurar automação N8N</p>
                            </div>
                          </button>
                        </div>
                      )}

                      {/* Estado 4: Mostrar "Validar Fluxo" se fluxo criado/validado mas webhook não validado */}
                      {connection?.waha_status === 'connected' && connection?.waha_session_name && (connection?.n8n_status === 'created' || connection?.n8n_status === 'validated') && !webhookValidated && (
                        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6 transition-all duration-500 ease-out hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10">
                          <button
                            onClick={() => handleWAHAAction('configureN8NWebhook')}
                            disabled={loading}
                            className="w-full flex flex-col items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <MessageSquare className="w-6 h-6 text-purple-400" />
                            </div>
                            <div className="text-center">
                              <span className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">Validar Fluxo</span>
                              <p className="text-xs text-gray-400 mt-1">Configurar webhook</p>
                            </div>
                          </button>
                        </div>
                      )}

                   </div>

                  {/* Status Display */}
                  <div className="mt-6 p-4 bg-gray-800/50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        connection?.waha_status === 'connected' ? 'bg-green-500' :
                        connection?.waha_status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                        connection?.waha_status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <span className="text-sm font-medium text-gray-300">
                        Status: {connection?.waha_status === 'connected' ? 'Conectado' : connection?.waha_status === 'connecting' ? 'Conectando' : connection?.waha_status === 'error' ? 'Erro' : 'Desconectado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6">
                    <div className="flex items-start gap-3">
                      <X className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-lg font-bold text-red-400 mb-2">Erro na Operação</h4>
                        <p className="text-red-300">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Code Modal */}
                {showQrModal && qrCode && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-4xl w-full max-h-[70vh]">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <h3 className="text-2xl font-bold text-white">Conectar WhatsApp</h3>
                          {qrTimerActive && (
                            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-1">
                              <div className={`w-2 h-2 rounded-full ${qrTimer <= 2 ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                              <span className={`text-sm font-bold ${qrTimer <= 2 ? 'text-red-400' : 'text-yellow-400'}`}>
                                {qrTimer}s
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={handleQrModalClose}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white rounded-2xl p-6">
                          {qrCode ? (
                            <img
                              src={qrCode}
                              alt="QR Code WhatsApp"
                              className="w-full h-auto rounded-lg"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12">
                              <div className="relative float-animation">
                                {/* Esfera principal futurista */}
                                <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-full shadow-2xl shadow-cyan-500/50 animate-pulse futuristic-glow">
                                  {/* Anéis orbitais */}
                                  <div className="absolute inset-0 rounded-full border-2 border-cyan-300/60 animate-spin" style={{animationDuration: '3s'}}></div>
                                  <div className="absolute inset-1 rounded-full border border-blue-400/40 animate-spin" style={{animationDuration: '2s', animationDirection: 'reverse'}}></div>
                                  <div className="absolute inset-2 rounded-full border border-purple-400/30 animate-spin" style={{animationDuration: '1.5s'}}></div>

                                  {/* Núcleo pulsante */}
                                  <div className="absolute inset-4 bg-gradient-to-br from-white to-cyan-200 rounded-full animate-pulse shadow-inner">
                                    <div className="absolute inset-2 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full animate-ping opacity-75"></div>
                                    <div className="absolute inset-3 bg-white rounded-full shadow-lg flex items-center justify-center">
                                      <div className="w-2 h-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full animate-pulse"></div>
                                    </div>
                                  </div>

                                  {/* Partículas orbitais */}
                                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-lg shadow-cyan-400/50"></div>
                                  <div className="absolute top-1/2 -right-1 left-auto transform -translate-y-1/2 w-1 h-1 bg-blue-400 rounded-full animate-pulse animation-delay-500"></div>
                                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full animate-ping animation-delay-300"></div>
                                  <div className="absolute top-1/2 -left-1 right-auto transform -translate-y-1/2 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse animation-delay-200"></div>
                                </div>

                                {/* Ondas de energia expansivas */}
                                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 animate-ping" style={{animationDuration: '2s'}}></div>
                                <div className="absolute inset-0 rounded-full border border-blue-400/15 animate-ping animation-delay-100" style={{animationDuration: '2.5s'}}></div>
                                <div className="absolute inset-0 rounded-full border border-purple-400/10 animate-ping animation-delay-200" style={{animationDuration: '3s'}}></div>
                              </div>

                              <div className="text-center mt-8">
                                <p className="text-gray-600 font-bold text-xl bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                  Gerando QR Code...
                                </p>
                                <p className="text-gray-500 text-sm mt-2">Inicializando protocolos de autenticação</p>
                                <div className="flex justify-center mt-4 space-x-2">
                                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce shadow-lg shadow-cyan-500/50"></div>
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-100 shadow-lg shadow-blue-500/50"></div>
                                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce animation-delay-200 shadow-lg shadow-purple-500/50"></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                            <h4 className="text-white font-semibold mb-2">Como conectar:</h4>
                            <ol className="text-gray-300 text-sm space-y-2">
                              <li>1. Abra o WhatsApp no seu celular</li>
                              <li>2. Vá em Configurações → WhatsApp Web</li>
                              <li>3. Escaneie o QR Code acima</li>
                              <li>4. Aguarde a confirmação de conexão</li>
                            </ol>
                            {qrTimerActive && (
                              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-blue-300 text-sm font-medium">
                                  ⏱️ Aguardando conexão... {qrTimer > 0 ? `${qrTimer} segundos restantes` : 'Tempo esgotado'}
                                </p>
                                <p className="text-blue-400 text-xs mt-2">
                                  1. Escaneie o QR Code no WhatsApp do seu celular
                                </p>
                                <p className="text-blue-400 text-xs mt-1">
                                  2. Aguarde a confirmação de conexão
                                </p>
                                <p className="text-blue-400 text-xs mt-1">
                                  3. O modal fechará automaticamente quando conectar
                                </p>
                                <p className="text-yellow-400 text-xs mt-2 font-medium">
                                  💡 Se não conectar automaticamente, clique em "Verificar Status"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            console.log('🔄 Manual status check requested...');
                            try {
                              // Use the new Edge Function to check and sync status
                              const result = await supabase.functions.invoke('check-waha-status', {
                                body: { sessionName: 'default' }
                              });

                              if (result.error) {
                                console.error('❌ Error calling check-waha-status:', result.error);
                                alert('Erro ao verificar status. Tente novamente.');
                                return;
                              }

                              const data = result.data;
                              console.log('📊 Manual check result:', data);

                              if (data.success && data.databaseStatus === 'connected') {
                                console.log('✅ Manual check: Connection established!');
                                alert('Conexão estabelecida com sucesso!');
                                setConnectionEstablished(true);
                                setShowQrModal(false);
                                setQrTimerActive(false);
                                setQrTimer(30);
                              } else {
                                alert(`Status atual: ${data.databaseStatus}. Status do servidor: ${data.wahaStatus}. Continue aguardando ou tente novamente.`);
                              }
                            } catch (error) {
                              console.error('Error in manual check:', error);
                              alert('Erro ao verificar status. Tente novamente.');
                            }
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                          Verificar Status
                        </button>

                        <button
                          onClick={handleQrModalClose}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'configure' && (
              <div className="space-y-8">
                {/* Seleção de Tipo de Agente */}
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl flex items-center justify-center">
                      <Settings2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Tipo de Agente</h3>
                      <p className="text-gray-400 text-sm">Selecione o tipo de agente que melhor atende suas necessidades</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Scheduler Mode: Only show Scheduling Agent */}
                    {isSchedulerMode ? (
                      <button
                        onClick={() => setAgentType('scheduling')}
                        className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                          agentType === 'scheduling'
                            ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/25'
                            : 'border-gray-600 bg-gray-800/50 hover:border-purple-500/50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            agentType === 'scheduling' ? 'bg-purple-500/20' : 'bg-gray-600/20'
                          }`}>
                            <svg className={`w-6 h-6 ${agentType === 'scheduling' ? 'text-purple-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <h4 className={`font-bold text-lg ${agentType === 'scheduling' ? 'text-purple-400' : 'text-white'}`}>Agendamento</h4>
                            <p className={`text-sm mt-1 ${agentType === 'scheduling' ? 'text-purple-300' : 'text-gray-400'}`}>
                              Gerenciamento de agenda
                            </p>
                          </div>
                        </div>
                      </button>
                    ) : (
                      <>
                        {/* Agente Comercial */}
                        <button
                          onClick={() => setAgentType('commercial')}
                          className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                            agentType === 'commercial'
                              ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/25'
                              : 'border-gray-600 bg-gray-800/50 hover:border-green-500/50'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              agentType === 'commercial' ? 'bg-green-500/20' : 'bg-gray-600/20'
                            }`}>
                              <svg className={`w-6 h-6 ${agentType === 'commercial' ? 'text-green-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                            </div>
                            <div className="text-center">
                              <h4 className={`font-bold text-lg ${agentType === 'commercial' ? 'text-green-400' : 'text-white'}`}>Comercial</h4>
                              <p className={`text-sm mt-1 ${agentType === 'commercial' ? 'text-green-300' : 'text-gray-400'}`}>
                                Vendas e conversão de leads
                              </p>
                            </div>
                          </div>
                        </button>

                        {/* Agente de Suporte */}
                        <button
                          onClick={() => setAgentType('support')}
                          className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                            agentType === 'support'
                              ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/25'
                              : 'border-gray-600 bg-gray-800/50 hover:border-blue-500/50'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              agentType === 'support' ? 'bg-blue-500/20' : 'bg-gray-600/20'
                            }`}>
                              <svg className={`w-6 h-6 ${agentType === 'support' ? 'text-blue-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                              </svg>
                            </div>
                            <div className="text-center">
                              <h4 className={`font-bold text-lg ${agentType === 'support' ? 'text-blue-400' : 'text-white'}`}>Suporte</h4>
                              <p className={`text-sm mt-1 ${agentType === 'support' ? 'text-blue-300' : 'text-gray-400'}`}>
                                Atendimento pós-venda
                              </p>
                            </div>
                          </div>
                        </button>

                        {/* Agente de Cobrança */}
                        <button
                          onClick={() => setAgentType('billing')}
                          className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                            agentType === 'billing'
                              ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/25'
                              : 'border-gray-600 bg-gray-800/50 hover:border-red-500/50'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              agentType === 'billing' ? 'bg-red-500/20' : 'bg-gray-600/20'
                            }`}>
                              <svg className={`w-6 h-6 ${agentType === 'billing' ? 'text-red-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="text-center">
                              <h4 className={`font-bold text-lg ${agentType === 'billing' ? 'text-red-400' : 'text-white'}`}>Cobrança</h4>
                              <p className={`text-sm mt-1 ${agentType === 'billing' ? 'text-red-300' : 'text-gray-400'}`}>
                                Gestão de pagamentos
                              </p>
                            </div>
                          </div>
                        </button>
                      </>
                    )}

                  </div>

                  {/* Descrição do tipo selecionado */}
                  <div className="mt-6 p-4 bg-gray-800/50 rounded-2xl">
                    <h4 className="text-white font-semibold mb-2">
                      {agentType === 'commercial' && '🎯 Agente Comercial'}
                      {agentType === 'support' && '🛠️ Agente de Suporte'}
                      {agentType === 'billing' && '💰 Agente de Cobrança'}
                      {agentType === 'scheduling' && '📅 Agente de Agendamento'}
                    </h4>
                    <p className="text-gray-300 text-sm">
                      {agentType === 'commercial' && 'Focado em vendas, apresentação de serviços, conversão de leads e agendamento de consultas.'}
                      {agentType === 'support' && 'Especializado em atendimento pós-venda, resolução de dúvidas e suporte técnico aos clientes.'}
                      {agentType === 'billing' && 'Gerencia pagamentos pendentes, negociações de dívidas e confirmação de recebimentos.'}
                      {agentType === 'scheduling' && 'Gerencia agendamentos, reagendamentos, consultas de disponibilidade e confirmações de consultas.'}
                    </p>
                    {isSchedulerMode && (
                      <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <p className="text-purple-300 text-xs">
                          💡 Este agente está otimizado para trabalhar com o sistema de agendamentos do Kito Expert, podendo consultar disponibilidade, criar agendamentos e gerenciar agendas automaticamente.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl flex items-center justify-center">
                      <Brain className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Configuração do Agente IA</h3>
                      <p className="text-gray-400 text-sm">Configure os parâmetros da inteligência artificial do seu assistente</p>
                    </div>
                  </div>

                  {/* Abas de Configuração por Tipo */}
                  <div className="mb-6">
                    <div className="flex border-b border-gray-700">
                      <button
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                          'border-purple-500 text-purple-400'
                        }`}
                      >
                        {agentType === 'commercial' && '🎯 Configuração Comercial'}
                        {agentType === 'support' && '🛠️ Configuração de Suporte'}
                        {agentType === 'billing' && '💰 Configuração de Cobrança'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personalidade do Agente */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg flex items-center justify-center">
                          <Brain className="w-4 h-4 text-purple-400" />
                        </div>
                        <h4 className="text-lg font-bold text-white">Personalidade do Agente</h4>
                      </div>
                      <textarea
                        value={agentPersonality}
                        onChange={(e) => {
                          console.log('✏️ Personality changed to:', e.target.value);
                          setAgentPersonality(e.target.value);
                        }}
                        placeholder={
                          agentType === 'commercial'
                            ? "Ex: 'Você é um vendedor experiente e persuasivo, sempre focado em converter leads em clientes...'"
                            : agentType === 'support'
                            ? "Ex: 'Você é um especialista em suporte ao cliente, paciente e soluciona problemas eficientemente...'"
                            : agentType === 'billing'
                            ? "Ex: 'Você é um profissional de cobrança educado mas firme, focado em resolver pendências financeiras...'"
                            : "Ex: 'Você é um assistente especializado em agendamentos, organizado e eficiente em gerenciar agendas...'"
                        }
                        className="w-full h-24 px-4 py-3 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all resize-none"
                        rows={4}
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        {agentType === 'commercial' && 'Defina uma personalidade persuasiva e orientada a vendas.'}
                        {agentType === 'support' && 'Defina uma personalidade paciente e solucionadora de problemas.'}
                        {agentType === 'billing' && 'Defina uma personalidade profissional e focada em resultados financeiros.'}
                      </p>
                    </div>

                    {/* Apresentação/Saudação */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-blue-400" />
                        </div>
                        <h4 className="text-lg font-bold text-white">Apresentação Inicial</h4>
                      </div>
                      <textarea
                        value={agentGreeting}
                        onChange={(e) => setAgentGreeting(e.target.value)}
                        placeholder="Digite a mensagem de apresentação que o agente enviará quando iniciar uma conversa. Ex: 'Olá! Sou o assistente virtual da Kito Expert. Como posso ajudar você hoje?'"
                        className="w-full h-20 px-4 py-3 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none"
                        rows={3}
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Esta mensagem será enviada automaticamente quando um cliente iniciar uma conversa.
                      </p>
                    </div>

                    {/* Conhecimento da Empresa */}
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg flex items-center justify-center">
                          <Settings2 className="w-4 h-4 text-green-400" />
                        </div>
                        <h4 className="text-lg font-bold text-white">Conhecimento da Empresa</h4>
                      </div>
                      <textarea
                        value={companyKnowledge}
                        onChange={(e) => setCompanyKnowledge(e.target.value)}
                        placeholder="Descreva informações sobre sua empresa. Ex: 'A Kito Expert é uma empresa especializada em agendamentos online, oferecendo serviços de beleza, saúde e bem-estar. Fundada em 2024, atendemos clientes em todo o Brasil...'"
                        className="w-full h-32 px-4 py-3 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all resize-none"
                        rows={5}
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Inclua informações sobre história, missão, valores, localização, horário de funcionamento, etc.
                      </p>
                    </div>

                    {/* Conhecimento dos Produtos/Serviços */}
                    <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-lg flex items-center justify-center">
                          <Bot className="w-4 h-4 text-orange-400" />
                        </div>
                        <h4 className="text-lg font-bold text-white">Produtos e Serviços</h4>
                      </div>
                      <textarea
                        value={servicesKnowledge}
                        onChange={(e) => setServicesKnowledge(e.target.value)}
                        placeholder={
                          agentType === 'commercial'
                            ? "Liste serviços com foco em vendas: 'Cortes premium: R$ 80 | Pacotes completos: R$ 150 | Descontos para primeira visita...'"
                            : agentType === 'support'
                            ? "Liste serviços com foco em suporte: 'Consultas de follow-up gratuitas | Ajustes pós-serviço | Suporte técnico...'"
                            : "Liste serviços com foco financeiro: 'Formas de pagamento | Planos de parcelamento | Descontos por pagamento à vista...'"
                        }
                        className="w-full h-32 px-4 py-3 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all resize-none"
                        rows={5}
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        {agentType === 'commercial' && 'Liste serviços enfatizando benefícios e valores agregados para vendas.'}
                        {agentType === 'support' && 'Liste serviços de suporte e soluções pós-atendimento.'}
                        {agentType === 'billing' && 'Liste opções de pagamento e políticas financeiras.'}
                      </p>
                    </div>


                    {/* Configurações Técnicas - Span completo */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-red-500/10 to-red-600/5 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-lg flex items-center justify-center">
                          <Zap className="w-4 h-4 text-red-400" />
                        </div>
                        <h4 className="text-lg font-bold text-white">Configurações Técnicas</h4>
                      </div>

                      <div className="max-w-md">
                        <label className="block text-sm font-medium text-white mb-2">
                          Temperatura da IA
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={aiTemperature}
                          onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
                          className="w-full h-2 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Conservador (0)</span>
                          <span>Criativo (2)</span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={continuousLearning}
                            onChange={(e) => setContinuousLearning(e.target.checked)}
                            className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
                          />
                          <span className="text-sm text-white">Ativar modo de aprendizado contínuo</span>
                        </label>
                        <p className="text-xs text-gray-400 mt-1 ml-6">
                          Permite que o agente aprenda com as conversas e melhore suas respostas.
                        </p>
                      </div>
                    </div>


                    {/* Botão Salvar */}
                    <div className="flex justify-end">
                      <button
                        onClick={saveAgentConfiguration}
                        disabled={savingAgentConfig}
                        className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingAgentConfig ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Brain className="w-5 h-5" />
                        )}
                        {savingAgentConfig ? 'Salvando...' : 'Salvar Configurações'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'test' && (
              <div className="space-y-6">
                {/* Progress Steps */}
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-white">Progresso da Configuração</h3>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${connection?.waha_status === 'connected' && agentConfig?.personality && agentConfig?.presentation && agentConfig?.company_knowledge && agentConfig?.product_knowledge && agentConfig?.personality_validated ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                      <span className="text-sm text-gray-300">
                        {connection?.waha_status === 'connected' && agentConfig?.personality && agentConfig?.presentation && agentConfig?.company_knowledge && agentConfig?.product_knowledge && agentConfig?.personality_validated ? 'Completo' : 'Em andamento'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Step 1: WhatsApp Connected */}
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                        connection?.waha_status === 'connected'
                          ? 'bg-green-500/20 border-2 border-green-500'
                          : 'bg-gray-500/20 border-2 border-gray-500'
                      }`}>
                        <Smartphone className={`w-8 h-8 ${
                          connection?.waha_status === 'connected' ? 'text-green-400' : 'text-gray-400'
                        }`} />
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">WhatsApp Conectado</h4>
                      <p className="text-sm text-gray-400">
                        {connection?.waha_status === 'connected'
                          ? 'Conexão estabelecida com sucesso'
                          : 'Aguardando conexão com WhatsApp'
                        }
                      </p>
                      <div className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                        connection?.waha_status === 'connected'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {connection?.waha_status === 'connected' ? '✓ Concluído' : '⏳ Pendente'}
                      </div>
                    </div>

                    {/* Step 2: Agent Configuration */}
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                        agentConfig?.personality && agentConfig?.presentation && agentConfig?.company_knowledge && agentConfig?.product_knowledge
                          ? 'bg-blue-500/20 border-2 border-blue-500'
                          : 'bg-gray-500/20 border-2 border-gray-500'
                      }`}>
                        <Brain className={`w-8 h-8 ${
                          agentConfig?.personality && agentConfig?.presentation && agentConfig?.company_knowledge && agentConfig?.product_knowledge
                            ? 'text-blue-400'
                            : 'text-gray-400'
                        }`} />
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">Configuração do Agente</h4>
                      <p className="text-sm text-gray-400">
                        {agentConfig?.personality && agentConfig?.presentation && agentConfig?.company_knowledge && agentConfig?.product_knowledge
                          ? 'Todas as configurações foram salvas'
                          : 'Configure personalidade, apresentação e conhecimentos'
                        }
                      </p>
                      <div className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                        agentConfig?.personality && agentConfig?.presentation && agentConfig?.company_knowledge && agentConfig?.product_knowledge
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {agentConfig?.personality && agentConfig?.presentation && agentConfig?.company_knowledge && agentConfig?.product_knowledge ? '✓ Concluído' : '⏳ Pendente'}
                      </div>
                    </div>

                    {/* Step 3: Personality Validated */}
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                        agentConfig?.personality_validated
                          ? 'bg-purple-500/20 border-2 border-purple-500'
                          : 'bg-gray-500/20 border-2 border-gray-500'
                      }`}>
                        <CheckCircle className={`w-8 h-8 ${
                          agentConfig?.personality_validated
                            ? 'text-purple-400'
                            : 'text-gray-400'
                        }`} />
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">Personalidade Validada</h4>
                      <p className="text-sm text-gray-400">
                        {agentConfig?.personality_validated
                          ? 'Personalidade testada e validada'
                          : 'Teste a personalidade do agente'
                        }
                      </p>
                      <div className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                        agentConfig?.personality_validated
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {agentConfig?.personality_validated ? '✓ Concluído' : '⏳ Pendente'}
                      </div>
                    </div>
                  </div>

                  {/* Load to N8N Button - Only show when all steps are completed */}
                  {connection?.waha_status === 'connected' &&
                    agentConfig?.personality &&
                    agentConfig?.presentation &&
                    agentConfig?.company_knowledge &&
                    agentConfig?.product_knowledge &&
                    agentConfig?.personality_validated &&
                    (connection?.n8n_status === 'validated' || connection?.n8n_status === 'active') && (
                    <div className="mt-8 pt-6 border-t border-white/10">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={async () => {
                            try {
                              console.log('🚀 Loading workflow data...');

                              const { data, error } = await supabase.functions.invoke('load-n8n-workflow-data');

                              if (error) {
                                console.error('❌ Error loading workflow data:', error);
                                alert(`Erro ao carregar informações no fluxo: ${error.message}`);
                                return;
                              }

                              if (!data.success) {
                                console.error('❌ Function returned error:', data);
                                alert(`Erro: ${data.message}`);
                                return;
                              }

                              console.log('✅ Workflow data loaded successfully:', data);
                              alert('Informações carregadas com sucesso no fluxo N8N! O agente está pronto para funcionar.');

                              // Reload connection data to update status
                              // Note: actions.reload() doesn't exist, using internal loadConnection from hook

                            } catch (error) {
                              console.error('💥 Error in load workflow data:', error);
                              alert(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                            }
                          }}
                          disabled={loading}
                          className="px-8 py-4 bg-gradient-to-r from-[#c4d82e] to-[#b8d025] hover:from-[#b8d025] hover:to-[#a8c025] disabled:bg-gray-600 text-black font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:cursor-not-allowed shadow-lg shadow-[#c4d82e]/25 hover:shadow-[#c4d82e]/40 flex items-center gap-3"
                        >
                          {loading ? (
                            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Zap className="w-6 h-6" />
                          )}
                          {loading ? 'Carregando...' : 'Carregar Informações no Fluxo N8N'}
                        </button>
                      </div>
                      <p className="text-center text-sm text-gray-400 mt-3">
                        Todas as configurações foram validadas. Clique para carregar no fluxo de automação.
                      </p>
                    </div>
                  )}
                </div>

                {/* Chat Interface - Side by Side Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Chat - 2/3 width */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                    {/* Header - Scheduler Style */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-white text-xl mb-2 flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#c4d82e]/20 rounded-xl flex items-center justify-center">
                            <Bot className="w-5 h-5 text-[#c4d82e]" />
                          </div>
                          Teste do Agente
                        </h3>
                        <p className="text-gray-400 flex items-center gap-2">
                          <TestTube className="w-4 h-4" />
                          Converse com seu agente configurado
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-400 font-medium">Online</span>
                      </div>
                    </div>

                    {/* Chat Container */}
                    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                      {/* Messages Area */}
                      <div className="h-[500px] overflow-y-auto p-6 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                        {chatMessages.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                              <MessageCircle className="w-8 h-8 text-[#c4d82e]" />
                            </div>
                            <h3 className="text-white text-lg font-semibold mb-2">Inicie uma conversa</h3>
                            <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                              Digite uma mensagem para testar seu agente configurado com IA
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {chatMessages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl ${
                                    message.sender === 'user'
                                      ? 'bg-[#c4d82e] text-black rounded-br-md'
                                      : 'bg-gradient-to-br from-white/10 to-white/5 text-white rounded-bl-md border border-white/20'
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                                  <p className={`text-xs mt-2 ${
                                    message.sender === 'user' ? 'text-black/70' : 'text-gray-400'
                                  }`}>
                                    {message.timestamp.toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}

                            {/* Typing Indicator */}
                            {sendingMessage && (
                              <div className="flex justify-start">
                                <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 text-white px-4 py-3 rounded-2xl rounded-bl-md">
                                  <div className="flex items-center gap-2">
                                    <div className="flex space-x-1">
                                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-100"></div>
                                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200"></div>
                                    </div>
                                    <span className="text-xs text-gray-400 ml-2">Digitando...</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Message Input - Scheduler Style */}
                      <div className="p-6 border-t border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/30">
                        <div className="flex gap-3">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                              placeholder="Digite sua mensagem..."
                              disabled={sendingMessage}
                              className="w-full px-4 py-3 pr-12 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#c4d82e] focus:ring-2 focus:ring-[#c4d82e]/20 transition-all disabled:opacity-50"
                            />
                            {chatInput.trim() && (
                              <button
                                onClick={() => setChatInput('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Send Text Button */}
                          <button
                            onClick={sendChatMessage}
                            disabled={!chatInput.trim() || sendingMessage}
                            className="px-6 py-3 bg-gradient-to-r from-[#c4d82e] to-[#b8d025] hover:from-[#b8d025] hover:to-[#a8c025] disabled:bg-gray-600 text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed shadow-lg shadow-[#c4d82e]/25 hover:shadow-[#c4d82e]/40 flex items-center gap-2"
                          >
                            {sendingMessage ? (
                              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                                <span className="text-sm">Enviar</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Audio Controls - REMOVED for text-only responses */}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar - Chat Controls - 1/3 width */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Chat Controls Card */}
                    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl flex items-center justify-center">
                          <Settings2 className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">Controles do Chat</h3>
                          <p className="text-gray-400 text-sm">Gerencie sua conversa</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Reset Chat Button */}
                        <button
                          onClick={() => {
                            if (window.confirm('Tem certeza que deseja limpar todo o histórico de mensagens?')) {
                              setChatMessages([]);
                              setChatInput('');
                            }
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-500/20 to-red-600/10 hover:from-red-500/30 hover:to-red-600/20 border border-red-500/30 hover:border-red-500/50 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                          <RotateCcw className="w-5 h-5 text-red-400" />
                          <span className="text-red-300 font-medium">Resetar Chat</span>
                        </button>

                        {/* Save as Template Button */}
                        <button
                          onClick={async () => {
                            if (chatMessages.length === 0) {
                              alert('Não há mensagens para salvar como modelo.');
                              return;
                            }

                            const templateName = prompt('Digite um nome para este modelo de conversa:');
                            if (!templateName?.trim()) return;

                            try {
                              const { data: { user }, error: userError } = await supabase.auth.getUser();
                              if (userError || !user) {
                                throw new Error('Usuário não autenticado');
                              }

                              // Try to create table first (ignore errors if it already exists)
                              try {
                                await supabase.rpc('exec_sql', {
                                  sql: `
                                    CREATE TABLE IF NOT EXISTS chat_templates (
                                      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                                      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                                      name TEXT NOT NULL,
                                      messages JSONB NOT NULL,
                                      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                                      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                                    );
                                  `
                                });
                              } catch (tableError) {
                                console.warn('Could not create table automatically, it might already exist:', tableError);
                              }

                              const { error } = await supabase
                                .from('chat_templates')
                                .insert({
                                  user_id: user.id,
                                  name: templateName.trim(),
                                  messages: chatMessages,
                                  created_at: new Date().toISOString()
                                });

                              if (error) {
                                console.error('Error saving chat template:', error);
                                throw new Error('Erro ao salvar modelo de conversa');
                              }

                              alert('Modelo de conversa salvo com sucesso!');
                            } catch (error) {
                              console.error('Error saving chat template:', error);
                              alert(`Erro ao salvar modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                            }
                          }}
                          disabled={chatMessages.length === 0}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-500/20 to-green-600/10 hover:from-green-500/30 hover:to-green-600/20 border border-green-500/30 hover:border-green-500/50 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-5 h-5 text-green-400" />
                          <span className="text-green-300 font-medium">Salvar como Modelo</span>
                        </button>
                      </div>
                    </div>

                    {/* Instructions Card */}
                    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">Instruções</h3>
                          <p className="text-gray-400 text-sm">Como usar o teste</p>
                        </div>
                      </div>

                      <div className="space-y-4 text-sm text-gray-300">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-blue-400 font-bold text-xs">1</span>
                          </div>
                          <p>Configure seu agente na aba "Configurar Agente" antes de testar</p>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-green-400 font-bold text-xs">2</span>
                          </div>
                          <p>Digite mensagens como se fosse um cliente real</p>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-purple-400 font-bold text-xs">3</span>
                          </div>
                          <p>Salve conversas interessantes como modelos para treinar o agente</p>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-orange-400 font-bold text-xs">4</span>
                          </div>
                          <p>Use "Resetar Chat" para começar uma nova conversa</p>
                        </div>
                      </div>

                      {/* Ver Modelos Button */}
                      <div className="pt-4 border-t border-white/10">
                        <button
                          onClick={() => {
                            setShowTemplatesList(!showTemplatesList);
                            if (!showTemplatesList) {
                              loadChatTemplates();
                            }
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-500/20 to-orange-600/10 hover:from-orange-500/30 hover:to-orange-600/20 border border-orange-500/30 hover:border-orange-500/50 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                          <Eye className="w-5 h-5 text-orange-400" />
                          <span className="text-orange-300 font-medium">Ver Modelos Salvos</span>
                          {showTemplatesList ? <ChevronUp className="w-4 h-4 text-orange-400 ml-auto" /> : <ChevronDown className="w-4 h-4 text-orange-400 ml-auto" />}
                        </button>

                        {/* Templates List */}
                        {showTemplatesList && (
                          <div className="mt-4 space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
                            {loadingTemplates ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-gray-400 ml-3">Carregando modelos...</span>
                              </div>
                            ) : chatTemplates.length === 0 ? (
                              <div className="text-center py-8">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                  <MessageSquare className="w-6 h-6 text-orange-400" />
                                </div>
                                <p className="text-gray-400 text-sm">Nenhum modelo salvo ainda</p>
                                <p className="text-gray-500 text-xs mt-1">Salve conversas como modelos para visualizá-las aqui</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {chatTemplates.map((template) => (
                                  <div
                                    key={template.id}
                                    className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-gray-600/30 rounded-xl p-4 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all duration-300 cursor-pointer group"
                                    onClick={() => loadChatTemplate(template)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <h4 className="text-white font-semibold text-sm mb-1 group-hover:text-orange-300 transition-colors">{template.name}</h4>
                                        <p className="text-gray-400 text-xs">
                                          {new Date(template.created_at).toLocaleDateString('pt-BR')} •
                                          {Array.isArray(template.messages) ? template.messages.length : 0} mensagens
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation(); // Prevent card click
                                            deleteChatTemplate(template.id);
                                          }}
                                          className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100"
                                          title="Excluir modelo"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuration Status and Validation Button - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Configuration Status */}
                  <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-[#c4d82e]/10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">Status da Configuração</h4>
                        <p className="text-gray-400 text-sm">Configurações salvas do agente</p>
                      </div>
                      <div className="flex gap-1">
                        <div className={`w-3 h-3 rounded-full ${agentConfig?.personality ? 'bg-green-500' : 'bg-red-500'}`} title="Personalidade"></div>
                        <div className={`w-3 h-3 rounded-full ${agentConfig?.presentation ? 'bg-green-500' : 'bg-red-500'}`} title="Apresentação"></div>
                        <div className={`w-3 h-3 rounded-full ${agentConfig?.company_knowledge ? 'bg-green-500' : 'bg-red-500'}`} title="Empresa"></div>
                        <div className={`w-3 h-3 rounded-full ${agentConfig?.product_knowledge ? 'bg-green-500' : 'bg-red-500'}`} title="Produtos"></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${agentConfig?.personality ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs text-gray-300 font-medium">Personalidade</span>
                      </div>
                      <div className="text-center">
                        <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${agentConfig?.presentation ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs text-gray-300 font-medium">Apresentação</span>
                      </div>
                      <div className="text-center">
                        <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${agentConfig?.company_knowledge ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs text-gray-300 font-medium">Empresa</span>
                      </div>
                      <div className="text-center">
                        <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${agentConfig?.product_knowledge ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs text-gray-300 font-medium">Produtos</span>
                      </div>
                    </div>
                  </div>

                  {/* Validation Button */}
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6 flex items-center justify-center">
                    <button
                      onClick={async () => {
                        // If already validated, don't do anything
                        if (agentConfig?.personality_validated) {
                          return;
                        }

                        // Check if personality is configured
                        if (!agentConfig?.personality) {
                          alert('Configure a personalidade do agente primeiro na aba "Configurar Agente"');
                          return;
                        }

                        setValidatingPersonality(true);

                        try {
                          // Send a test message to validate personality
                          setChatInput("Olá, quem é você?");
                          await new Promise(resolve => setTimeout(resolve, 100));
                          await sendChatMessage();

                          // Wait a bit for the response
                          await new Promise(resolve => setTimeout(resolve, 2000));

                          // Mark personality as validated
                          const { data: { user }, error: userError } = await supabase.auth.getUser();
                          if (userError || !user) {
                            throw new Error('Usuário não autenticado');
                          }

                          const { error } = await supabase
                            .from('agent_configs')
                            .update({
                              personality_validated: true,
                              updated_at: new Date().toISOString()
                            })
                            .eq('user_id', user.id);

                          if (error) {
                            console.error('Error updating personality validation:', error);
                            throw new Error('Erro ao salvar validação da personalidade');
                          }

                          // Reload agent config to update the UI
                          await loadAgentConfig();

                          alert('Personalidade validada com sucesso! Agora clique em "Carregar Informações no Fluxo N8N" para ativar o agente.');
                        } catch (error) {
                          console.error('Error validating personality:', error);
                          alert(`Erro na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                        } finally {
                          setValidatingPersonality(false);
                        }
                      }}
                      disabled={agentConfig?.personality_validated || validatingPersonality}
                      className={`px-6 py-4 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 ${
                        agentConfig?.personality_validated
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white cursor-not-allowed opacity-75'
                          : validatingPersonality
                          ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white cursor-wait'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:scale-105 active:scale-95 shadow-lg shadow-green-500/25 hover:shadow-green-500/40'
                      }`}
                    >
                      {validatingPersonality ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      {validatingPersonality ? 'Validando...' : agentConfig?.personality_validated ? 'Personalidade Validada' : 'Validar Personalidade'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsappPage;