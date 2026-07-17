import React, { useState, useEffect } from 'react';
import { Smartphone, Bot, Play, Square, MessageSquare, Settings, Users, ShoppingCart, Headphones, Calendar } from 'lucide-react';
import { ConnectionTab } from './components/ConnectionTab';
import { AgentTab } from './components/AgentTab';
import { AppConfig, Message } from './types';
import { loadConfig, saveConfig } from './utils/storage';
import { WAHAApi, generateAIResponse } from './utils/wahaApi';

type Tab = 'connection' | 'agent';
type AgentType = 'comercial' | 'suporte' | 'cobranca' | 'agendamento';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('connection');
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('comercial');
  const [config, setConfig] = useState<AppConfig>(loadConfig());
  const [messages, setMessages] = useState<Message[]>([]);

  // Configurações específicas para cada agente
  const agentConfigs = {
    comercial: {
      name: 'Comercial',
      icon: ShoppingCart,
      color: 'text-blue-600',
      personality: 'Você é um assistente comercial especializado em vendas e prospecção de clientes. Seja persuasivo, entusiasmado e focado em converter leads em vendas. Destaque benefícios dos produtos/serviços e crie senso de urgência positiva.',
      company_presentation: 'Somos uma empresa líder em soluções inovadoras, oferecendo produtos de alta qualidade com atendimento personalizado.',
      company_knowledge: 'Produtos premium, garantia estendida, suporte técnico especializado, preços competitivos.',
      product_knowledge: 'Catálogo completo com opções para todos os perfis de clientes, personalização disponível, entrega rápida.'
    },
    suporte: {
      name: 'Suporte',
      icon: Headphones,
      color: 'text-green-600',
      personality: 'Você é um assistente de suporte ao cliente. Seja prestativo, paciente e focado em resolver problemas. Mostre empatia, ofereça soluções claras e garanta satisfação total do cliente.',
      company_presentation: 'Oferecemos suporte técnico completo e atendimento ao cliente de excelência para garantir sua satisfação.',
      company_knowledge: 'Suporte 24/7, resolução rápida de problemas, equipe especializada, acompanhamento personalizado.',
      product_knowledge: 'Soluções completas para todas as necessidades, manutenção preventiva, upgrades disponíveis.'
    },
    cobranca: {
      name: 'Cobrança',
      icon: Users,
      color: 'text-red-600',
      personality: 'Você é um assistente de cobrança. Seja profissional, firme mas educado. Foque em resolver pendências de pagamento, ofereça opções de negociação e mantenha bom relacionamento com o cliente.',
      company_presentation: 'Gerenciamos cobranças de forma ética e eficiente, sempre buscando soluções que beneficiem ambas as partes.',
      company_knowledge: 'Políticas de pagamento flexíveis, negociação de dívidas, parcelamento disponível, prazos especiais.',
      product_knowledge: 'Diversas formas de pagamento, descontos por pontualidade, programas de fidelidade.'
    },
    agendamento: {
      name: 'Agendamento',
      icon: Calendar,
      color: 'text-purple-600',
      personality: 'Você é um assistente de agendamento. Seja organizado, eficiente e focado em otimizar a agenda. Confirme detalhes, sugira horários alternativos e garanta que tudo fique registrado corretamente.',
      company_presentation: 'Especialistas em gestão de agendas e otimização de tempo para máxima produtividade.',
      company_knowledge: 'Sistema de agendamento inteligente, lembretes automáticos, reagendamento flexível, confirmação por múltiplos canais.',
      product_knowledge: 'Serviços diversos com horários flexíveis, profissionais especializados, atendimento personalizado.'
    }
  };

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  // Log inicial para indicar que a app não processa mensagens reais
  useEffect(() => {
    console.log('🚨 [WHATSAPP APP] App initialized - NOTE: This app SIMULATES WhatsApp messages, does not process REAL incoming messages');
    console.log('🔗 [WHATSAPP APP] For real WhatsApp integration, webhooks need to be implemented');
    console.log('🤖 [WHATSAPP APP] AI responses are MOCKED - no real Gemini/OpenAI integration');
    console.log('⚠️ [WHATSAPP APP] N8N workflow integration MISSING');
    console.log('📡 [WHATSAPP APP] Webhook processing NOT implemented for real messages');
  }, []);

  const handleConfigChange = (updates: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleToggleAutomation = async () => {
    if (config.isRunning) {
      // Parar automação
      handleConfigChange({ isRunning: false });
      console.log('Automação parada');
    } else {
      // Iniciar automação
      if (!config.session || config.session.status !== 'WORKING') {
        alert('Por favor, conecte o WhatsApp primeiro');
        return;
      }
      
      if (!config.agent.enabled) {
        alert('Por favor, ative o agente de IA primeiro');
        return;
      }

      handleConfigChange({ isRunning: true });
      console.log('Automação iniciada');
      
      // Simular recebimento de mensagens para demonstração
      simulateIncomingMessages();
    }
  };

  const simulateIncomingMessages = () => {
    console.log('🎭 [SIMULATION] Starting message simulation for agent:', selectedAgent);

    const demoMessagesByAgent = {
      comercial: [
        'Olá, estou interessado nos seus produtos',
        'Quais são as opções de preços?',
        'Como posso adquirir o plano premium?',
        'Vocês oferecem desconto para primeira compra?',
        'Quais são os benefícios do produto?'
      ],
      suporte: [
        'Olá, estou com problema no meu pedido',
        'Como posso resolver um erro no sistema?',
        'Preciso de ajuda técnica urgente',
        'O produto que recebi está com defeito',
        'Como faço para redefinir minha senha?'
      ],
      cobranca: [
        'Olá, quero negociar minha dívida',
        'Qual é o valor pendente da minha conta?',
        'Posso parcelar o pagamento?',
        'Quando vence a próxima parcela?',
        'Como posso quitar tudo de uma vez?'
      ],
      agendamento: [
        'Olá, quero marcar uma consulta',
        'Quais horários estão disponíveis amanhã?',
        'Preciso reagendar meu compromisso',
        'Como cancelo um agendamento?',
        'Vocês atendem aos finais de semana?'
      ]
    };

    const demoMessages = demoMessagesByAgent[selectedAgent];

    let messageIndex = 0;
    const interval = setInterval(async () => {
      if (!config.isRunning || messageIndex >= demoMessages.length) {
        console.log('🎭 [SIMULATION] Stopping simulation - automation stopped or all messages sent');
        clearInterval(interval);
        return;
      }

      const messageText = demoMessages[messageIndex];
      console.log('📨 [SIMULATION] Simulating incoming message:', messageText);

      const incomingMessage: Message = {
        id: `msg_${Date.now()}_${messageIndex}`,
        from: `55119999999${messageIndex}@c.us`,
        body: messageText,
        timestamp: Date.now(),
        type: 'incoming'
      };

      setMessages(prev => [...prev, incomingMessage]);

      // Gerar resposta automaticamente
      if (config.agent.enabled) {
        try {
          const currentAgentConfig = agentConfigs[selectedAgent];
          const response = await generateAIResponse(messageText, {
            personality: currentAgentConfig.personality,
            company_presentation: currentAgentConfig.company_presentation,
            company_knowledge: currentAgentConfig.company_knowledge,
            product_knowledge: currentAgentConfig.product_knowledge
          });
          
          const outgoingMessage: Message = {
            id: `reply_${Date.now()}_${messageIndex}`,
            from: 'bot',
            body: response,
            timestamp: Date.now() + 1000,
            type: 'outgoing'
          };

          setMessages(prev => [...prev, outgoingMessage]);
          
          // Simular envio via WAHA
          if (config.session) {
            const wahaApi = new WAHAApi(config.wahaUrl, config.wahaApiKey);
            await wahaApi.sendMessage(config.sessionName, incomingMessage.from, response);
          }
        } catch (error) {
          console.error('Error generating AI response:', error);
        }
      }

      messageIndex++;
    }, 5000 + Math.random() * 5000); // Entre 5-10 segundos
  };

  const canStartAutomation = () => {
    return (
      config.session?.status === 'WORKING' && 
      config.agent.enabled
    );
  };

  const getStatusIndicator = () => {
    const isConnected = config.session?.status === 'WORKING';
    const isAgentEnabled = config.agent.enabled;
    
    if (config.isRunning) {
      return { color: 'bg-green-500', text: 'Funcionando' };
    } else if (isConnected && isAgentEnabled) {
      return { color: 'bg-yellow-500', text: 'Pronto para iniciar' };
    } else if (isConnected) {
      return { color: 'bg-blue-500', text: 'WhatsApp conectado' };
    } else {
      return { color: 'bg-gray-400', text: 'Desconectado' };
    }
  };

  const status = getStatusIndicator();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-green-600" />
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">
                  WhatsApp AI Automation
                </h1>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${agentConfigs[selectedAgent].color} bg-gray-100`}>
                  {React.createElement(agentConfigs[selectedAgent].icon, { className: "w-4 h-4" })}
                  {agentConfigs[selectedAgent].name}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Agent Selector */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value as AgentType)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(agentConfigs).map(([key, agent]) => (
                    <option key={key} value={key}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                <span className="text-sm font-medium text-gray-700">
                  {status.text} - {agentConfigs[selectedAgent].name}
                </span>
              </div>

              {/* Play/Stop Button */}
              <button
                onClick={handleToggleAutomation}
                disabled={!canStartAutomation() && !config.isRunning}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors
                  ${config.isRunning 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white'
                  }
                `}
              >
                {config.isRunning ? (
                  <>
                    <Square className="w-4 h-4" />
                    Parar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Iniciar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border mb-6">
              <div className="border-b">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('connection')}
                    className={`
                      py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === 'connection'
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      Conexão WhatsApp
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('agent')}
                    className={`
                      py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === 'agent'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      Agente de IA
                    </div>
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'connection' && (
                  <ConnectionTab 
                    config={config} 
                    onConfigChange={handleConfigChange} 
                  />
                )}
                {activeTab === 'agent' && (
                   <AgentTab
                     config={config}
                     onConfigChange={handleConfigChange}
                     selectedAgent={selectedAgent}
                     agentConfigs={agentConfigs}
                   />
                 )}
              </div>
            </div>
          </div>

          {/* Sidebar - Messages Log */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border sticky top-8">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Mensagens</h3>
                </div>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    Nenhuma mensagem ainda
                  </p>
                ) : (
                  messages.slice(-10).map((message) => (
                    <div
                      key={message.id}
                      className={`p-2 rounded-md text-sm ${
                        message.type === 'incoming'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <div className="font-medium text-xs mb-1">
                        {message.type === 'incoming' ? 'Recebida' : 'Enviada'}
                        <span className="text-gray-500 ml-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div>{message.body}</div>
                    </div>
                  ))
                )}
              </div>
              
              {messages.length > 10 && (
                <div className="p-3 border-t text-center">
                  <span className="text-xs text-gray-500">
                    Mostrando últimas 10 mensagens
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;