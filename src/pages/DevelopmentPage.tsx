import React from 'react';
import { ArrowLeft, Code, Bot } from 'lucide-react';
import { WhatsAppSetupWizard } from '../components/WhatsAppSetupWizard';

interface DevelopmentPageProps {
  onBack: () => void;
}

export const DevelopmentPage: React.FC<DevelopmentPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar ao Dashboard</span>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bot className="w-6 h-6 text-blue-600" />
                <Code className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm text-gray-500">
                Agente de Desenvolvimento - WhatsApp com IA
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <Bot className="w-12 h-12" />
              <Code className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Agente de Desenvolvimento
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Configure seu assistente inteligente de WhatsApp com IA avançada.
              Automatize conversas, processe mensagens e integre com seus sistemas de desenvolvimento.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <WhatsAppSetupWizard />
        </div>
      </main>
    </div>
  );
};

export default DevelopmentPage;