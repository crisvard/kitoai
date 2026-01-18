import React from 'react';
import { CheckCircle, AlertCircle, Server, Workflow, Bot } from 'lucide-react';

interface CredentialsStepProps {
  onComplete: () => void;
}

export const CredentialsStep: React.FC<CredentialsStepProps> = ({ onComplete }) => {
  console.log('🚀 CredentialsStep renderizado - versão NOVA!');

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start">
          <CheckCircle className="w-8 h-8 text-green-500 mt-1 mr-4 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              ✅ CREDENCIAIS DO SISTEMA CONFIGURADAS
            </h3>
            <p className="text-green-700 mb-4">
              Todas as credenciais necessárias já estão configuradas no sistema.
              Elas são usadas automaticamente sem exposição no frontend.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Servidor WhatsApp */}
              <div className="bg-white border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Server className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-medium text-gray-900">Servidor WhatsApp</span>
                </div>
                <p className="text-sm text-gray-600">
                  API de WhatsApp configurada
                </p>
              </div>

              {/* Automação */}
              <div className="bg-white border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Workflow className="w-5 h-5 text-orange-600 mr-2" />
                  <span className="font-medium text-gray-900">Automação</span>
                </div>
                <p className="text-sm text-gray-600">
                  Sistema de automação configurado
                </p>
              </div>

              {/* IA */}
              <div className="bg-white border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Bot className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="font-medium text-gray-900">IA</span>
                </div>
                <p className="text-sm text-gray-600">
                  Inteligência artificial configurada
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">
              🔒 Segurança Garantida
            </h4>
            <p className="text-sm text-blue-700">
              As credenciais são armazenadas criptografadas e acessadas apenas pelo sistema backend.
              O frontend nunca tem acesso direto às chaves de API.
            </p>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={onComplete}
          className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Continuar para WhatsApp
        </button>
      </div>
    </div>
  );
};