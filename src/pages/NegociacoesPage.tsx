import React from 'react';
import NegociacoesApp from '../negociacoes/App';

interface NegociacoesPageProps {
  onBack: () => void;
}

const NegociacoesPage: React.FC<NegociacoesPageProps> = ({ onBack }) => {
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

      <NegociacoesApp />
    </div>
  );
};

export default NegociacoesPage;
