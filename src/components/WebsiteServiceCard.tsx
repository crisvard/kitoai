import { Globe, ExternalLink, Github, Key, Database, FileText, Plus } from 'lucide-react';

interface WebsiteServiceCardProps {
  isContracted?: boolean;
  onConfigure: () => void;
  setupText?: string;
}

function WebsiteServiceCard({ isContracted = false, onConfigure, setupText = 'Gerenciar Sites' }: WebsiteServiceCardProps) {
  return (
    <div className={`group relative bg-[#2a2a2a] rounded-2xl p-8 border transition-all duration-300 hover:shadow-2xl hover:shadow-[#c4d82e]/10 hover:-translate-y-1 w-full aspect-square flex flex-col ${
      isContracted
        ? 'border-gray-800 hover:border-[#c4d82e]/50'
        : 'border-gray-700/50'
    }`}>
      {/* Lock overlay for non-contracted service */}
      {!isContracted && (
        <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center z-10">
          <div className="bg-gray-800/90 rounded-full p-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      )}

      {/* Status indicator */}
      {isContracted && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
      )}

      {/* Icon container */}
      <div className="flex-1 flex items-center justify-center mb-6">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
          isContracted
            ? 'bg-[#c4d82e]/20 text-[#c4d82e] shadow-lg shadow-[#c4d82e]/20'
            : 'bg-[#3a3a3a] text-gray-400 group-hover:text-[#c4d82e] group-hover:bg-[#c4d82e]/10'
        }`}>
          <Globe className="w-10 h-10" />
        </div>
      </div>

      {/* Content */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#c4d82e] transition-colors">
          Desenvolvimento de Sites
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
          Gerenciamento completo de seus projetos web. Acesse links, credenciais, hospedagem e compartilhe detalhes de integração.
        </p>
      </div>

      {/* Feature icons */}
      {isContracted && (
        <div className="grid grid-cols-4 gap-2 mb-6 px-2">
          <div className="flex items-center justify-center p-2 rounded-lg bg-[#c4d82e]/10 text-[#c4d82e] text-xs" title="Link do site">
            <ExternalLink className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-center p-2 rounded-lg bg-[#c4d82e]/10 text-[#c4d82e] text-xs" title="Credenciais">
            <Key className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-center p-2 rounded-lg bg-[#c4d82e]/10 text-[#c4d82e] text-xs" title="GitHub">
            <Github className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-center p-2 rounded-lg bg-[#c4d82e]/10 text-[#c4d82e] text-xs" title="Hospedagem">
            <Database className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mt-auto">
        <button
          onClick={onConfigure}
          disabled={!isContracted}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
            isContracted
              ? 'bg-[#c4d82e] text-black hover:bg-[#b4c820] active:scale-95'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
          }`}>
          {isContracted ? (
            <>
              {setupText.includes('Gerenciar') ? <ExternalLink className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {setupText}
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Contratar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default WebsiteServiceCard;
