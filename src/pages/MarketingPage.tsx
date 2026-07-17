import React from 'react';
import MarketingApp from '../marketing/App';
import { useUserProfile } from '../hooks/useUserProfile';

interface MarketingPageProps {
  onBack: () => void;
}

const MarketingPage: React.FC<MarketingPageProps> = ({ onBack }) => {
  const { profile } = useUserProfile();
  const isBlocked = profile?.marketing_access_blocked;

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Voltar</span>
          </button>

          <div className="mt-10 rounded-3xl border border-red-500/40 bg-[#161616] p-8 shadow-xl shadow-red-500/10">
            <h1 className="text-3xl font-bold text-white mb-4">Acesso bloqueado</h1>
            <p className="text-gray-300 mb-4">
              Seu agente de marketing está bloqueado no momento. Entre em contato com o suporte ou verifique sua assinatura para liberar o acesso.
            </p>
            {profile?.marketing_block_reason && (
              <p className="text-sm text-gray-400">Motivo: {profile.marketing_block_reason}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Voltar</span>
        </button>
      </div>

      <MarketingApp />
    </div>
  );
};

export default MarketingPage;
