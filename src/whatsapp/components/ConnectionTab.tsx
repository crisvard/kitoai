import React, { useState, useEffect } from 'react';
import { Smartphone, Wifi, WifiOff, RotateCcw, CheckCircle, AlertCircle, Server, Key, User, Webhook, Link, Settings2 } from 'lucide-react';
import { WAHASession, AppConfig } from '../types';
import { WAHAApi } from '../utils/wahaApi';

// Componente para exibir QR Code
const QRCodeDisplay: React.FC<{
  sessionName: string;
  wahaUrl: string;
  wahaApiKey: string;
}> = ({ sessionName, wahaUrl, wahaApiKey }) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        // Tentar endpoints diferentes para obter QR code
        const endpoints = [
          `${wahaUrl}/api/qr?session=${sessionName}`,
          `${wahaUrl}/api/sessions/${sessionName}/qr`,
          `${wahaUrl}/api/screenshot?session=${sessionName}`
        ];

        // Usar endpoint oficial do WAHA para QR code
        try {
          const response = await fetch(`${wahaUrl}/api/${sessionName}/auth/qr?format=image`, {
            headers: {
              'X-API-Key': wahaApiKey,
            },
          });

          if (response.ok) {
            // Converter blob para base64
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onload = () => {
              setQrCode(reader.result as string);
              setLoading(false);
            };
            reader.readAsDataURL(blob);
            return;
          } else {
            console.log('QR endpoint returned:', response.status);
          }
        } catch (e) {
          console.log('QR endpoint failed, trying screenshot...');
        }

        // Fallback para screenshot se QR direto falhar
        try {
          const response = await fetch(`${wahaUrl}/api/screenshot?session=${sessionName}`, {
            headers: {
              'X-API-Key': wahaApiKey,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onload = () => {
              setQrCode(reader.result as string);
              setLoading(false);
            };
            reader.readAsDataURL(blob);
          } else {
            console.log('Screenshot endpoint returned:', response.status);
            setLoading(false);
          }
        } catch (e) {
          console.error('Screenshot fallback also failed');
          setLoading(false);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching QR code:', error);
        setLoading(false);
      }
    };

    fetchQRCode();
    // Atualizar a cada 3 segundos
    const interval = setInterval(fetchQRCode, 3000);
    return () => clearInterval(interval);
  }, [sessionName, wahaUrl, wahaApiKey]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="w-48 h-48 bg-gray-300 rounded-lg mx-auto"></div>
        <p className="text-gray-600 text-sm mt-2">Carregando QR Code...</p>
      </div>
    );
  }

  if (!qrCode) {
    return (
      <div className="text-center">
        <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
          <span className="text-gray-500">QR Code não disponível</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
      alt="QR Code WhatsApp"
      className="mx-auto max-w-xs rounded-xl shadow-lg"
    />
  );
};

interface ConnectionTabProps {
  config: AppConfig;
  onConfigChange: (updates: Partial<AppConfig>) => void;
}

export const ConnectionTab: React.FC<ConnectionTabProps> = ({ config, onConfigChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'testing' | 'connected'>('disconnected');

  // Webhook configuration
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['message', 'session.status']);
  const [loadingWebhook, setLoadingWebhook] = useState(false);
  const [webhookConfigured, setWebhookConfigured] = useState(false);

  const wahaApi = new WAHAApi(config.wahaUrl, config.wahaApiKey);

  useEffect(() => {
    // Não carregar automaticamente sessão existente - deixar usuário decidir
  }, [config.wahaUrl]);

  const loadExistingSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await wahaApi.getSession(config.sessionName);

      // Se estiver em SCAN_QR_CODE, tentar obter o QR code
      if (session.status === 'SCAN_QR_CODE') {
        try {
          // Tentar obter QR code diretamente (se disponível)
          const qrResponse = await fetch(`${config.wahaUrl}/api/sessions/${config.sessionName}/qr`, {
            headers: {
              'X-API-Key': config.wahaApiKey,
              'Content-Type': 'application/json',
            },
          });

          if (qrResponse && qrResponse.ok) {
            const qrData = await qrResponse.text();
            // Se for uma resposta JSON com QR code
            try {
              const qrJson = JSON.parse(qrData);
              if (qrJson.qr) {
                session.qr = qrJson.qr;
              } else if (qrJson.base64) {
                session.qr = qrJson.base64;
              }
            } catch {
              // Se for base64 direto
              session.qr = qrData;
            }
          } else {
            // Fallback para screenshot
            const qrScreenshot = await wahaApi.getScreenshot(config.sessionName);
            const base64Data = qrScreenshot.split(',')[1];
            session.qr = base64Data;
          }
        } catch (qrErr) {
          console.log('QR code not available yet, trying screenshot...');
          try {
            // Fallback para screenshot
            const qrScreenshot = await wahaApi.getScreenshot(config.sessionName);
            const base64Data = qrScreenshot.split(',')[1];
            session.qr = base64Data;
          } catch (screenshotErr) {
            console.log('Screenshot not available yet');
          }
        }
      }

      onConfigChange({ session });

      // Iniciar polling se não estiver conectada
      if (session.status !== 'WORKING') {
        pollSessionStatus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sessão não encontrada. Tente criar uma nova.');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    setError(null);
    try {
      const isConnected = await wahaApi.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      if (!isConnected) {
        setError('Não foi possível conectar ao servidor WAHA');
      }
    } catch (err) {
      setConnectionStatus('disconnected');
      setError('Servidor WAHA não disponível. Configure a URL correta do servidor.');
    }
  };

  const handleCreateSession = async () => {
    setLoading(true);
    setError(null);

    try {
      // Primeiro tenta obter sessão existente
      let session;
      try {
        session = await wahaApi.getSession(config.sessionName);
        console.log('Existing session found:', session);
      } catch (err) {
        // Sessão não existe, criar nova
        console.log('Creating new session...');
        session = await wahaApi.createSession(config.sessionName);
      }

      onConfigChange({ session });

      // Se a sessão estiver parada, tentar iniciar
      if (session.status === 'STOPPED') {
        console.log('Starting stopped session...');
        await wahaApi.startSession(config.sessionName);
        // Recarregar status após iniciar
        session = await wahaApi.getSession(config.sessionName);
        onConfigChange({ session });
      }

      // Iniciar polling se não estiver conectada
      if (session.status !== 'WORKING') {
        pollSessionStatus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const pollSessionStatus = () => {
    const interval = setInterval(async () => {
      try {
        const session = await wahaApi.getSession(config.sessionName);

        // O QR code será obtido pelo componente QRCodeDisplay quando necessário
        // Não precisamos fazer polling aqui

        onConfigChange({ session });

        if (session.status === 'WORKING') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling session status:', err);
        clearInterval(interval);
      }
    }, 3000); // Aumentar para 3 segundos para dar tempo do screenshot

    // Limpar polling após 5 minutos
    setTimeout(() => clearInterval(interval), 300000);
  };

  const handleDisconnect = async () => {
    if (config.session) {
      setLoading(true);
      try {
        await wahaApi.stopSession(config.sessionName);
        onConfigChange({ session: undefined });
        setWebhookConfigured(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao desconectar');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfigureWebhook = async () => {
    if (!config.session || !webhookUrl.trim()) {
      setError('URL do webhook é obrigatória');
      return;
    }

    setLoadingWebhook(true);
    setError(null);

    try {
      // Atualizar configuração da sessão com webhook
      const updateData = {
        config: {
          webhooks: [
            {
              url: webhookUrl,
              events: selectedEvents,
              headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Source': 'kito-expert'
              }
            }
          ]
        }
      };

      // Fazer requisição PUT para atualizar a sessão
      const response = await fetch(`${config.wahaUrl}/api/sessions/${config.sessionName}`, {
        method: 'PUT',
        headers: {
          'X-API-Key': config.wahaApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`Erro ao configurar webhook: ${response.statusText}`);
      }

      setWebhookConfigured(true);
      console.log('Webhook configurado com sucesso');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao configurar webhook');
    } finally {
      setLoadingWebhook(false);
    }
  };

  const availableEvents = [
    { value: 'message', label: 'Mensagens', description: 'Receber mensagens recebidas/enviadas' },
    { value: 'session.status', label: 'Status da Sessão', description: 'Mudanças no status da conexão' },
    { value: 'message.ack', label: 'Confirmação de Mensagem', description: 'Quando mensagens são lidas/entregues' },
    { value: 'group.join', label: 'Entrada em Grupo', description: 'Quando entra em um grupo' },
    { value: 'group.leave', label: 'Saída de Grupo', description: 'Quando sai de um grupo' },
  ];

  const getStatusColor = () => {
    if (!config.session) return 'text-gray-400';
    
    switch (config.session.status) {
      case 'WORKING':
        return 'text-green-400';
      case 'SCAN_QR_CODE':
        return 'text-blue-400';
      case 'STARTING':
        return 'text-yellow-400';
      case 'FAILED':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    if (!config.session) return 'Desconectado';
    
    switch (config.session.status) {
      case 'WORKING':
        return 'Conectado';
      case 'SCAN_QR_CODE':
        return 'Escaneie o QR Code';
      case 'STARTING':
        return 'Iniciando...';
      case 'FAILED':
        return 'Falha na conexão';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* WAHA Configuration - FIRST */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl flex items-center justify-center">
            <Server className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Configuração WAHA</h3>
            <p className="text-gray-400 text-sm">Configure os parâmetros do servidor</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <Server className="w-4 h-4" />
              URL do Servidor WAHA
            </label>
            <input
              type="url"
              value={config.wahaUrl}
              onChange={(e) => onConfigChange({ wahaUrl: e.target.value })}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
              placeholder="http://localhost:3000"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <Key className="w-4 h-4" />
              API Key (opcional)
            </label>
            <input
              type="password"
              value={config.wahaApiKey}
              onChange={(e) => onConfigChange({ wahaApiKey: e.target.value })}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
              placeholder="Deixe em branco se não for necessário"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <User className="w-4 h-4" />
              Nome da Sessão
            </label>
            <input
              type="text"
              value={config.sessionName}
              onChange={(e) => onConfigChange({ sessionName: e.target.value })}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
              placeholder="default"
            />
          </div>
        </div>
      </div>

      {/* Connection Status - SECOND */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-2xl flex items-center justify-center">
            {connectionStatus === 'connected' ? (
              <Wifi className="w-6 h-6 text-[#c4d82e]" />
            ) : (
              <WifiOff className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Status da Conexão WAHA</h3>
            <p className="text-gray-400 text-sm">Verifique se o servidor está acessível</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'testing' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'
            }`} />
            <span className={`font-semibold ${
              connectionStatus === 'connected' ? 'text-green-400' :
              connectionStatus === 'testing' ? 'text-yellow-400' : 'text-gray-400'
            }`}>
              {connectionStatus === 'connected' ? 'Conectado' :
               connectionStatus === 'testing' ? 'Testando...' : 'Desconectado'}
            </span>
          </div>
          <button
            onClick={testConnection}
            disabled={connectionStatus === 'testing'}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-gray-300 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className={`w-4 h-4 ${connectionStatus === 'testing' ? 'animate-spin' : ''}`} />
            Testar
          </button>
        </div>
      </div>

      {/* WhatsApp Connection */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-2xl flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Conexão WhatsApp</h3>
            <p className="text-gray-400 text-sm">Conecte sua conta do WhatsApp</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {config.session?.status === 'WORKING' ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-400" />
            )}
            <span className={`font-semibold ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>

          {config.session?.me && (
            <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <span className="text-sm text-gray-300">
                {config.session.me.pushName}
              </span>
            </div>
          )}
        </div>

        {/* Instructions */}
        {!config.session && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-300 mb-1">
                  Escolha o tipo de conexão:
                </p>
                <p className="text-xs text-blue-200">
                  <strong>Nova Sessão:</strong> Cria uma nova sessão do WhatsApp (primeiro uso)<br/>
                  <strong>Carregar Sessão:</strong> Carrega uma sessão existente que já foi criada
                </p>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Display */}
        {config.session?.status === 'SCAN_QR_CODE' && (
          <div className="bg-gradient-to-br from-[#c4d82e]/5 to-[#c4d82e]/2 border border-[#c4d82e]/20 rounded-2xl p-6 mb-6 text-center">
            <div className="mb-4">
              <QRCodeDisplay sessionName={config.sessionName} wahaUrl={config.wahaUrl} wahaApiKey={config.wahaApiKey} />
            </div>
            <p className="text-[#c4d82e] font-medium">
              Escaneie o QR Code acima com seu WhatsApp
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Abra o WhatsApp no seu celular e vá em Configurações → WhatsApp Web
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {!config.session ? (
            <div className="flex gap-3 w-full">
              <button
                onClick={handleCreateSession}
                disabled={loading || connectionStatus !== 'connected'}
                className="flex-1 bg-[#c4d82e] hover:bg-[#b5c928] disabled:bg-gray-600 disabled:text-gray-400 text-black font-bold py-4 px-6 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-[#c4d82e]/30 hover:scale-105 active:scale-95 disabled:hover:scale-100 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <RotateCcw className="w-5 h-5 animate-spin" />
                ) : (
                  <Smartphone className="w-5 h-5" />
                )}
                {loading ? 'Criando...' : 'Nova Sessão'}
              </button>
              <button
                onClick={loadExistingSession}
                disabled={loading || connectionStatus !== 'connected'}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105 active:scale-95 disabled:hover:scale-100 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <RotateCcw className="w-5 h-5 animate-spin" />
                ) : (
                  <RotateCcw className="w-5 h-5" />
                )}
                {loading ? 'Carregando...' : 'Carregar Sessão'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="flex-1 bg-red-600/90 hover:bg-red-600 disabled:bg-gray-600 disabled:text-gray-400 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 hover:scale-105 active:scale-95 disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
              {loading ? (
                <RotateCcw className="w-5 h-5 animate-spin" />
              ) : (
                <WifiOff className="w-5 h-5" />
              )}
              Desconectar
            </button>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Webhook Configuration - Only show when connected */}
      {config.session?.status === 'WORKING' && (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-2xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Configuração de Webhook</h3>
              <p className="text-gray-400 text-sm">Configure webhooks para receber eventos do WhatsApp</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                <Server className="w-4 h-4" />
                URL do Webhook
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
                placeholder="https://seu-servidor.com/webhook/whatsapp"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                <Key className="w-4 h-4" />
                API Key (opcional)
              </label>
              <input
                type="password"
                value={config.wahaApiKey}
                readOnly
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white opacity-60 cursor-not-allowed"
                placeholder="Deixe em branco se não for necessário"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                <User className="w-4 h-4" />
                Nome da Sessão
              </label>
              <input
                type="text"
                value={config.sessionName}
                readOnly
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white opacity-60 cursor-not-allowed"
                placeholder="default"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-700">
            <div className="flex items-center gap-2">
              {webhookConfigured ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">Webhook configurado</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400">Webhook não configurado</span>
                </>
              )}
            </div>

            <button
              onClick={handleConfigureWebhook}
              disabled={loadingWebhook || !webhookUrl.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-[#c4d82e] hover:bg-[#b5c928] disabled:bg-gray-600 disabled:text-gray-400 text-black font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#c4d82e]/30 hover:scale-105 active:scale-95 disabled:hover:scale-100"
            >
              {loadingWebhook ? (
                <RotateCcw className="w-5 h-5 animate-spin" />
              ) : (
                <Webhook className="w-5 h-5" />
              )}
              {loadingWebhook ? 'Configurando...' : 'Validar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

