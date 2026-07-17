import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  getUserSocialAccounts,
  connectSocialAccount,
  disconnectSocialAccount,
  SocialAccount
} from '../utils/uploadPostApiNew';
import { initiateOAuth, isPlatformConfigured, getSupportedPlatforms } from '../utils/oauthService';

interface SocialAccountsManagerProps {
  onAccountConnected?: (account: SocialAccount) => void;
  onAccountDisconnected?: (accountId: string) => void;
}

const SocialAccountsManager: React.FC<SocialAccountsManagerProps> = ({
  onAccountConnected,
  onAccountDisconnected,
}) => {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Plataformas suportadas
  const supportedPlatforms = [
    { id: 'instagram', name: 'Instagram', color: 'from-pink-500 to-purple-500' },
    { id: 'facebook', name: 'Facebook', color: 'from-blue-600 to-blue-800' },
    { id: 'twitter', name: 'Twitter', color: 'from-blue-400 to-blue-600' },
    { id: 'linkedin', name: 'LinkedIn', color: 'from-blue-700 to-blue-900' },
    { id: 'tiktok', name: 'TikTok', color: 'from-black to-gray-800' },
    { id: 'youtube', name: 'YouTube', color: 'from-red-500 to-red-700' },
  ];

  // Carregar contas sociais
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const userAccounts = await getUserSocialAccounts();
      setAccounts(userAccounts);
    } catch (err) {
      console.error('Erro ao carregar contas:', err);
      setError('Falha ao carregar contas sociais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // Verificar se uma plataforma já está conectada
  const isPlatformConnected = (platform: string) => {
    return accounts.some(acc => acc.platform === platform && acc.is_active);
  };

  // Obter conta conectada para uma plataforma
  const getConnectedAccount = (platform: string) => {
    return accounts.find(acc => acc.platform === platform && acc.is_active);
  };

  // Conectar conta social
  const handleConnect = async (platform: string) => {
    try {
      setConnecting(platform);
      setError(null);

      // Verificar se a plataforma está configurada
      if (!isPlatformConfigured(platform)) {
        throw new Error(`Plataforma ${platform} não configurada. Configure as credenciais OAuth.`);
      }

      // Iniciar fluxo OAuth
      await initiateOAuth(platform as any);

      // Recarregar contas após conexão bem-sucedida
      await loadAccounts();

      onAccountConnected?.(accounts.find(acc => acc.platform === platform)!);
    } catch (err) {
      console.error('Erro ao conectar conta:', err);
      setError(`Falha ao conectar conta ${platform}: ${err.message}`);
    } finally {
      setConnecting(null);
    }
  };

  // Desconectar conta social
  const handleDisconnect = async (accountId: string, platform: string) => {
    try {
      setDisconnecting(accountId);
      setError(null);

      const success = await disconnectSocialAccount(accountId);
      if (success) {
        setAccounts(prev => prev.map(acc =>
          acc.id === accountId ? { ...acc, is_active: false } : acc
        ));
        onAccountDisconnected?.(accountId);
      } else {
        setError(`Falha ao desconectar conta ${platform}`);
      }
    } catch (err) {
      console.error('Erro ao desconectar conta:', err);
      setError(`Falha ao desconectar conta ${platform}: ${err.message}`);
    } finally {
      setDisconnecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando contas sociais...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Contas Sociais Conectadas
        </h2>
        <p className="text-gray-600">
          Conecte suas contas de redes sociais para agendar posts automaticamente.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supportedPlatforms.map((platform) => {
          const isConnected = isPlatformConnected(platform.id);
          const account = getConnectedAccount(platform.id);
          const isConnecting = connecting === platform.id;
          const isDisconnecting = disconnecting === account?.id;

          return (
            <div
              key={platform.id}
              className={`relative bg-white rounded-lg shadow-md border-2 transition-all duration-200 ${
                isConnected
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                    <span className="text-white font-bold text-lg">
                      {platform.name.charAt(0)}
                    </span>
                  </div>
                  {isConnected && (
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="ml-2 text-sm text-green-700 font-medium">
                        Conectado
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {platform.name}
                </h3>

                {isConnected && account ? (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Conta:</span> {account.account_name || account.account_username}
                    </p>
                    {account.account_username && (
                      <p className="text-sm text-gray-500">
                        @{account.account_username}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 mb-4">
                    Conecte sua conta para agendar posts automaticamente.
                  </p>
                )}

                <div className="flex justify-end">
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(account!.id, platform.id)}
                      disabled={isDisconnecting}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isDisconnecting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Desconectando...
                        </div>
                      ) : (
                        'Desconectar'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(platform.id)}
                      disabled={isConnecting}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isConnecting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Conectando...
                        </div>
                      ) : (
                        'Conectar'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Sobre a Conexão OAuth
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Atualmente usando modo de desenvolvimento. Em produção, a conexão OAuth
                será feita através de uma janela popup segura que redirecionará para
                a plataforma escolhida para autorização.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialAccountsManager;