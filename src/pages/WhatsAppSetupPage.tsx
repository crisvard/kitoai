import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { WhatsAppSetupWizard } from '../components/WhatsAppSetupWizard';

interface WhatsAppSetupPageProps {
  onBack: () => void;
}

export const WhatsAppSetupPage: React.FC<WhatsAppSetupPageProps> = ({ onBack }) => {
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
              <div className="text-sm text-gray-500">
                Configuração do Agente WhatsApp
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <WhatsAppSetupWizard />
      </main>
    </div>
  );
};

export default WhatsAppSetupPage;