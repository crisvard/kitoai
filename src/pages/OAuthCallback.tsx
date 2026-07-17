import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { processOAuthCallback } from '../utils/oauthService';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Verificar se há erro na URL
        if (error) {
          throw new Error(errorDescription || error);
        }

        // Verificar parâmetros obrigatórios
        if (!code || !state) {
          throw new Error('Parâmetros OAuth incompletos');
        }

        // Extrair plataforma do state (formato: platform_stateId)
        const platform = state.split('_')[0];
        if (!platform) {
          throw new Error('Plataforma não identificada');
        }

        // Processar callback
        await processOAuthCallback(code, state, platform);

        setStatus('success');
        setMessage('Conta conectada com sucesso! Você pode fechar esta janela.');

        // Fechar popup automaticamente após 3 segundos
        setTimeout(() => {
          window.close();
        }, 3000);

      } catch (error) {
        console.error('Erro no callback OAuth:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Erro desconhecido no OAuth');
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        {status === 'loading' && (
          <>
            <Loader className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Conectando conta...
            </h2>
            <p className="text-gray-600">
              Aguarde enquanto processamos sua autorização.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Conexão realizada!
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Fechar
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erro na conexão
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Fechar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;