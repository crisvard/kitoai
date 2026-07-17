import { User } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../contexts/AuthContext';

interface ClientInfoProps {
  onNavigateToAccount: () => void;
}

function ClientInfo({ onNavigateToAccount }: ClientInfoProps) {
  const { profile, loading, error } = useUserProfile();
  const { user } = useAuth();

  const handleAccountClick = () => {
    onNavigateToAccount();
  };

  return (
    <div className="sticky top-6">
      <button
        onClick={handleAccountClick}
        className="w-full group relative bg-gradient-to-br from-[#2a2a2a] to-[#252525] hover:from-[#c4d82e]/10 hover:to-[#c4d82e]/5 rounded-2xl p-6 border border-gray-800/50 hover:border-[#c4d82e]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#c4d82e]/10 hover:-translate-y-1"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-[#c4d82e]/20 group-hover:bg-[#c4d82e]/30 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <User className="w-8 h-8 text-[#c4d82e]" />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold text-white group-hover:text-[#c4d82e] transition-colors mb-1">
              {profile?.full_name || 'Minha Conta'}
            </h3>
            <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
              {user?.email || 'Gerenciar perfil e configurações'}
            </p>
          </div>
        </div>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#c4d82e]/0 to-[#c4d82e]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </button>
    </div>
  );
}

export default ClientInfo;
