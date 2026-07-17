import React, { useState } from 'react';
import { Link, CheckCircle, AlertCircle, Webhook, Workflow } from 'lucide-react';
import { useWhatsAppSetup } from '../../hooks/useWhatsAppSetup';

interface ValidationStepProps {
  onComplete: () => void;
}

export const ValidationStep: React.FC<ValidationStepProps> = ({ onComplete }) => {
  const { validateWebhook, createN8NWorkflow, loading } = useWhatsAppSetup();
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    webhookUrl?: string;
    message?: string;
  } | null>(null);
  const [flowValidationResult, setFlowValidationResult] = useState<{
    success: boolean;
    workflowId?: string;
    webhookUrl?: string;
    message?: string;
  } | null>(null);

  const handleValidateFlow = async () => {
    const result = await createN8NWorkflow();

    setFlowValidationResult({
      success: result.success,
      workflowId: result.workflowId,
      webhookUrl: result.webhookUrl,
      message: result.success ? 'Fluxo de automação criado com sucesso!' : result.message,
    });
  };

  const handleValidate = async () => {
    const result = await validateWebhook();

    setValidationResult({
      success: result.success,
      webhookUrl: result.webhookUrl,
      message: result.success ? 'Webhook configurado com sucesso!' : result.message,
    });

    if (result.success) {
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Validation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Validar Configuração de Webhook
        </h3>

        <div className="space-y-4">
          {/* N8N Workflow Validation */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start">
              <Workflow className="w-6 h-6 text-orange-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Validação do Fluxo de Automação
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• <strong>Ação:</strong> Cria fluxo de automação com webhook único</p>
                  <p>• <strong>Resultado:</strong> Fluxo isolado por usuário criado</p>
                  <p>• <strong>Status:</strong> Fluxo ativo e pronto para receber mensagens</p>
                </div>
              </div>
            </div>
          </div>

          {/* Flow Validation Result */}
          {flowValidationResult && (
            <div className={`p-4 rounded-lg border ${
              flowValidationResult.success
                ? 'bg-orange-50 border-orange-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center mb-2">
                {flowValidationResult.success ? (
                  <CheckCircle className="w-5 h-5 text-orange-500 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                )}
                <span className={`font-medium ${
                  flowValidationResult.success ? 'text-orange-700' : 'text-red-700'
                }`}>
                  {flowValidationResult.success ? 'Workflow Criado!' : 'Erro na Criação'}
                </span>
              </div>

              {flowValidationResult.message && (
                <p className={`text-sm mb-2 ${
                  flowValidationResult.success ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {flowValidationResult.message}
                </p>
              )}

              {flowValidationResult.workflowId && (
                <div>
                  <span className="text-sm text-gray-600">Workflow ID:</span>
                  <div className="mt-1">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {flowValidationResult.workflowId}
                    </code>
                  </div>
                </div>
              )}

              {flowValidationResult.webhookUrl && (
                <div className="mt-2">
                  <span className="text-sm text-gray-600">Webhook URL:</span>
                  <div className="mt-1">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                      {flowValidationResult.webhookUrl}
                    </code>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* WAHA Webhook Configuration */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start">
              <Webhook className="w-6 h-6 text-purple-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Configuração de Webhook
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• <strong>Origem:</strong> Webhook URL do fluxo de automação</p>
                  <p>• <strong>Destino:</strong> Sessão WhatsApp ativa</p>
                  <p>• <strong>Eventos:</strong> message, session.status</p>
                  <p>• <strong>Resultado:</strong> Mensagens do WhatsApp → IA → Resposta</p>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div className={`p-4 rounded-lg border ${
              validationResult.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center mb-2">
                {validationResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                )}
                <span className={`font-medium ${
                  validationResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {validationResult.success ? 'Validação Bem-Sucedida!' : 'Erro na Validação'}
                </span>
              </div>

              {validationResult.message && (
                <p className={`text-sm mb-2 ${
                  validationResult.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validationResult.message}
                </p>
              )}

              {validationResult.webhookUrl && (
                <div>
                  <span className="text-sm text-gray-600">Webhook configurado:</span>
                  <div className="mt-1">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                      {validationResult.webhookUrl}
                    </code>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={handleValidateFlow}
              disabled={loading || flowValidationResult?.success}
              className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : flowValidationResult?.success ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Fluxo Validado!
                </>
              ) : (
                <>
                  <Workflow className="w-4 h-4 mr-2" />
                  Validar Fluxo
                </>
              )}
            </button>

            <button
              onClick={handleValidate}
              disabled={loading || !flowValidationResult?.success}
              className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Validando...
                </>
              ) : validationResult?.success ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Validado!
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  Validar Webhook
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Flow Diagram */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Fluxo de Funcionamento
        </h3>

        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-4">
            {/* WhatsApp */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-green-600 font-bold text-lg">📱</span>
              </div>
              <span className="text-xs text-gray-600 text-center">WhatsApp</span>
            </div>

            {/* Arrow */}
            <div className="text-gray-400">→</div>

            {/* Servidor */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-blue-600 font-bold text-sm">🔗</span>
              </div>
              <span className="text-xs text-gray-600 text-center">Servidor</span>
            </div>

            {/* Arrow */}
            <div className="text-gray-400">→</div>

            {/* Webhook */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <Webhook className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs text-gray-600 text-center">Webhook</span>
            </div>

            {/* Arrow */}
            <div className="text-gray-400">→</div>

            {/* Automação */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-orange-600 font-bold text-sm">⚙️</span>
              </div>
              <span className="text-xs text-gray-600 text-center">Automação</span>
            </div>

            {/* Arrow */}
            <div className="text-gray-400">→</div>

            {/* IA */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-indigo-600 font-bold text-sm">🤖</span>
              </div>
              <span className="text-xs text-gray-600 text-center">IA</span>
            </div>

            {/* Arrow */}
            <div className="text-gray-400">→</div>

            {/* Response */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-green-600 font-bold text-sm">💬</span>
              </div>
              <span className="text-xs text-gray-600 text-center">Resposta</span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Este webhook conecta todo o fluxo de processamento de mensagens
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-purple-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-purple-800 mb-2">
              Validação Final:
            </h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Verifica se o webhook está configurado corretamente</li>
              <li>• Garante que as mensagens serão roteadas corretamente</li>
              <li>• Ativa o fluxo completo: WhatsApp → IA → Resposta</li>
              <li>• Libera a configuração do agente IA</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};