import React, { useState } from 'react';
import { Smartphone, Wifi, WifiOff, RotateCcw, CheckCircle, AlertCircle, QrCode } from 'lucide-react';
import { useWhatsAppSetup } from '../../hooks/useWhatsAppSetup';
import { LoadingOverlay } from '../ui/LoadingOverlay';

interface WAHAStepProps {
  onComplete: () => void;
}

export const WAHAStep: React.FC<WAHAStepProps> = ({ onComplete }) => {
  const { testWAHAConnection, createWAHASession, loading } = useWhatsAppSetup();
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'testing' | 'connected'>('disconnected');
  const [sessionName, setSessionName] = useState('default');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>('');

  // Estados de loading específicos para cada operação
  const [testingConnection, setTestingConnection] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('testing');

    try {
      const result = await testWAHAConnection();

      if (result.success) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCreateSession = async () => {
    // Validate connection first
    if (connectionStatus !== 'connected') {
      alert('Erro: Teste a conexão com o servidor WhatsApp primeiro antes de criar a sessão.');
      return;
    }

    if (!sessionName.trim()) {
      alert('Por favor, insira um nome para a sessão');
      return;
    }

    setCreatingSession(true);

    try {
      const result = await createWAHASession(sessionName);

      if (result.success) {
        setSessionStatus(result.session.status);

        if (result.session.qr) {
          setQrCode(result.session.qr);
        }

        // If already working, go to next step
        if (result.session.status === 'WORKING') {
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
      } else {
        // Error is already handled by the hook and displayed globally
        console.error('Failed to create WhatsApp session:', result.message);
        // Don't proceed if session creation failed
      }
    } finally {
      setCreatingSession(false);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'testing': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="w-5 h-5" />;
      case 'testing': return <RotateCcw className="w-5 h-5 animate-spin" />;
      default: return <WifiOff className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Test */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Teste de Conexão WhatsApp
        </h3>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-100' :
              connectionStatus === 'testing' ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              {getStatusIcon()}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {connectionStatus === 'connected' ? 'Conectado' :
                 connectionStatus === 'testing' ? 'Testando...' : 'Desconectado'}
              </p>
              <p className="text-sm text-gray-500">
                Servidor WhatsApp acessível
              </p>
            </div>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={loading || connectionStatus === 'testing'}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {connectionStatus === 'testing' ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Testar Conexão
              </>
            )}
          </button>
        </div>
      </div>

      {/* Session Creation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Criar Sessão WhatsApp
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Sessão
            </label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="default"
            />
            <p className="text-xs text-gray-500 mt-1">
              Identificador único para sua sessão WhatsApp
            </p>
          </div>

          {/* QR Code Display */}
          {qrCode && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <QrCode className="w-5 h-5 text-gray-600 mr-2" />
                <span className="font-medium text-gray-900">QR Code para WhatsApp</span>
              </div>

              <div className="flex justify-center">
                <img
                  src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                  alt="QR Code WhatsApp"
                  className="max-w-xs border border-gray-300 rounded-lg"
                />
              </div>

              <div className="mt-3 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Abra o WhatsApp no seu celular e escaneie o código acima
                </p>
                <p className="text-xs text-gray-500">
                  Vá em: Configurações → WhatsApp Web
                </p>
              </div>
            </div>
          )}

          {/* Session Status */}
          {sessionStatus && (
            <div className={`p-3 rounded-lg ${
              sessionStatus === 'WORKING'
                ? 'bg-green-50 border border-green-200'
                : sessionStatus === 'SCAN_QR_CODE'
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center">
                {sessionStatus === 'WORKING' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                ) : sessionStatus === 'SCAN_QR_CODE' ? (
                  <QrCode className="w-5 h-5 text-blue-500 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                )}
                <span className={`font-medium ${
                  sessionStatus === 'WORKING' ? 'text-green-700' :
                  sessionStatus === 'SCAN_QR_CODE' ? 'text-blue-700' : 'text-yellow-700'
                }`}>
                  {sessionStatus === 'WORKING' ? 'WhatsApp Conectado!' :
                   sessionStatus === 'SCAN_QR_CODE' ? 'Aguardando escaneamento do QR Code' :
                   `Status: ${sessionStatus}`}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleCreateSession}
              disabled={loading || connectionStatus !== 'connected'}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando Sessão...
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 mr-2" />
                  Criar Sessão WhatsApp
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Como conectar o WhatsApp:
            </h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Clique em "Testar Conexão" para verificar se o servidor está funcionando</li>
              <li>2. Clique em "Criar Sessão WhatsApp" para iniciar o processo</li>
              <li>3. Escaneie o QR Code com o WhatsApp no seu celular</li>
              <li>4. Aguarde a confirmação de conexão</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Loading Overlays */}
      <LoadingOverlay
        isVisible={testingConnection}
        message="🔍 Testando conexão com servidor WhatsApp..."
        variant="pulse"
        subMessage="Verificando se o WAHA está acessível..."
      />

      <LoadingOverlay
        isVisible={creatingSession}
        message="📱 Criando sessão WhatsApp..."
        variant="bounce"
        subMessage="Gerando QR Code para autenticação..."
      />
    </div>
  );
};