import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Settings, Smartphone, Workflow, Link, Bot } from 'lucide-react';
import { useWhatsAppSetup } from '../hooks/useWhatsAppSetup';
import { CredentialsStep } from './setup/CredentialsStep';
import { WAHAStep } from './setup/WAHAStep';
import { N8NStep } from './setup/N8NStep';
import { AgentStep } from './setup/AgentStep';

type Step = 'credentials' | 'waha' | 'n8n' | 'agent';

interface StepInfo {
  id: Step;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  enabled: boolean;
}

export const WhatsAppSetupWizard: React.FC = () => {
  const { setupStatus, loading, error } = useWhatsAppSetup();
  const [currentStep, setCurrentStep] = useState<Step>('credentials');

  const steps: StepInfo[] = [
    {
      id: 'credentials',
      title: 'Credenciais',
      description: 'Configure suas chaves de API',
      icon: Settings,
      completed: setupStatus.credentialsSaved,
      enabled: true,
    },
    {
      id: 'waha',
      title: 'WhatsApp',
      description: 'Conecte sua conta WhatsApp',
      icon: Smartphone,
      completed: setupStatus.wahaConnected,
      enabled: setupStatus.credentialsSaved,
    },
    {
      id: 'n8n',
      title: 'Workflow',
      description: 'Crie e valide o workflow de automação',
      icon: Workflow,
      completed: setupStatus.webhookValidated, // Agora o passo n8n só completa quando webhook está validado
      enabled: setupStatus.wahaConnected,
    },
    {
      id: 'agent',
      title: 'Agente IA',
      description: 'Configure seu assistente',
      icon: Bot,
      completed: setupStatus.agentConfigured,
      enabled: setupStatus.webhookValidated,
    },
  ];

  const currentStepInfo = steps.find(step => step.id === currentStep);

  const handleStepClick = (stepId: Step) => {
    const step = steps.find(s => s.id === stepId);
    if (step?.enabled) {
      setCurrentStep(stepId);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'credentials':
        return <CredentialsStep onComplete={() => setCurrentStep('waha')} />;
      case 'waha':
        return <WAHAStep onComplete={() => setCurrentStep('n8n')} />;
      case 'n8n':
        return <N8NStep onComplete={() => setCurrentStep('agent')} />;
      case 'agent':
        return <AgentStep onComplete={() => {}} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Configuração do Agente WhatsApp
        </h1>
        <p className="text-gray-600">
          Configure seu assistente de WhatsApp com IA em 5 passos simples
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.completed;

            return (
              <React.Fragment key={step.id}>
                <div
                  className={`flex flex-col items-center cursor-pointer transition-all ${
                    step.enabled ? 'hover:scale-105' : 'cursor-not-allowed opacity-50'
                  }`}
                  onClick={() => handleStepClick(step.id)}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-blue-500 text-white'
                        : step.enabled
                        ? 'bg-gray-200 text-gray-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 max-w-24">
                      {step.description}
                    </div>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 mt-[-20px] ${
                    steps[index + 1].completed ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Current Step Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentStepInfo?.title}
          </h2>
          <p className="text-gray-600">
            {currentStepInfo?.description}
          </p>
        </div>

        {renderCurrentStep()}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-gray-700">Processando...</span>
          </div>
        </div>
      )}
    </div>
  );
};