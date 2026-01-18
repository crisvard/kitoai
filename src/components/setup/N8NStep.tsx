import React, { useState } from 'react';
import { Workflow, CheckCircle, AlertCircle, Play } from 'lucide-react';
import { useWhatsAppConnection } from '../../hooks/useWhatsAppConnection';
import { LoadingOverlay } from '../ui/LoadingOverlay';

interface N8NStepProps {
  onComplete: () => void;
}

export const N8NStep: React.FC<N8NStepProps> = ({ onComplete }) => {
  const { actions, loading } = useWhatsAppConnection();
  const [workflowCreated, setWorkflowCreated] = useState(false); // Always start with false
  const [workflowValidated, setWorkflowValidated] = useState(false); // Always start with false
  const [workflowData, setWorkflowData] = useState<{
    id: string;
    name: string;
    webhookUrl: string;
  } | null>(null);

  // Estados de loading específicos para cada operação
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);
  const [validatingWorkflow, setValidatingWorkflow] = useState(false);

  // Validate dependencies - WhatsApp must be connected first
  const canCreateWorkflow = true; // Sempre permitir, o hook interno verifica

  // This component manages its own state - doesn't sync with global state
  // Each time user visits this step, they start fresh

  const handleCreateWorkflow = async () => {
    // Double-check dependencies before proceeding
    if (!canCreateWorkflow) {
      alert('Erro: WhatsApp deve estar conectado antes de criar o workflow. Complete os passos anteriores primeiro.');
      return;
    }

    setCreatingWorkflow(true);

    try {
      console.log('🔄 [N8N STEP] Calling cloneN8NWorkflow...');
      const result = await actions.cloneN8NWorkflow();

      console.log('📥 [N8N STEP] cloneN8NWorkflow result:', result);

      if (result.success) {
        setWorkflowCreated(true);
        setWorkflowValidated(true); // Já validado pelo cloneN8NWorkflow
        setWorkflowData({
          id: result.workflow.id,
          name: result.workflow.name,
          webhookUrl: result.workflow.webhookUrl,
        });

        // Auto-complete após 2 segundos
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        // Error is already handled by the hook and displayed globally
        console.error('Failed to create workflow:', result.message);
      }
    } finally {
      setCreatingWorkflow(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Workflow Creation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Criar Workflow de Automação
        </h3>

        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start">
              <Workflow className="w-6 h-6 text-orange-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Workflow: WhatsApp Agent Automation
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• <strong>Webhook Trigger:</strong> Recebe mensagens do WhatsApp</p>
                  <p>• <strong>Consulta Histórico:</strong> Busca histórico da conversa</p>
                  <p>• <strong>Processamento IA:</strong> Processa mensagem com contexto</p>
                  <p>• <strong>Envio Automático:</strong> Envia resposta automática</p>
                  <p>• <strong>Armazenamento:</strong> Salva resposta no banco</p>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Status */}
          {workflowCreated && workflowData ? (
            <div className="space-y-4">
              {/* Workflow Created and Validated */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="font-medium text-green-700">Workflow Criado, Configurado e Ativado!</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nome:</span>
                    <span className="font-medium text-gray-900">{workflowData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID:</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {workflowData.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Webhook URL:</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded max-w-xs truncate">
                      {workflowData.webhookUrl}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-sm text-green-700">
                  ✅ Webhook configurado automaticamente no WAHA<br/>
                  ✅ Workflow ativado e pronto para receber mensagens
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">
                    Workflow Automático
                  </h4>
                  <p className="text-sm text-blue-700">
                    O workflow será criado automaticamente com todas as configurações necessárias
                    para processar mensagens do WhatsApp e gerar respostas com IA.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Show create button only if workflow not created yet */}
          {!workflowCreated && (
            <div className="space-y-4">
              {/* Dependency Check */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">
                      Processo Automático
                    </h4>
                    <p className="text-sm text-blue-700">
                      O sistema irá criar o workflow, configurar o webhook no WAHA automaticamente
                      e ativar tudo em uma única operação.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCreateWorkflow}
                  disabled={loading || !canCreateWorkflow}
                  className="flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Criando Workflow...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Criar Fluxo de Automação
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-green-800 mb-2">
              Processo Automático Completo:
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li><strong>1. Criar Workflow:</strong> Clona template personalizado</li>
              <li><strong>2. Configurar Webhook WAHA:</strong> Envia URL para o WAHA automaticamente</li>
              <li><strong>3. Ativar Workflow:</strong> Ativa e conecta todos os sistemas</li>
              <li>• Webhook URL único por usuário para isolamento</li>
              <li>• WAHA configurado com eventos 'message' e 'session.status'</li>
              <li>• Tudo feito em uma única operação simplificada</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-800 mb-2">
          Detalhes Técnicos:
        </h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Trigger:</strong> Webhook (recebe mensagens do WhatsApp)</p>
          <p><strong>Processamento:</strong> Sistema → IA → Envio Automático</p>
          <p><strong>Persistência:</strong> Salva histórico de conversas</p>
          <p><strong>Segurança:</strong> Credenciais criptografadas</p>
        </div>
      </div>

      {/* Loading Overlays */}
      <LoadingOverlay
        isVisible={creatingWorkflow}
        message="🚀 Configurando automação completa..."
        variant="spinner"
        subMessage="Criando workflow, configurando webhook e ativando sistema..."
      />
    </div>
  );
};