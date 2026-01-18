import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/img/logo/logo1.png';

function TopBar() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      console.log('🚪 Iniciando logout via TopBar...');
      await signOut();
      // signOut() já faz o redirect, não precisa fazer novamente
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
    }
  };

  return (
    <header className="bg-gradient-to-r from-[#2a2a2a] to-[#252525] border-b border-gray-800/50 backdrop-blur-sm shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="main__logo">
            <a href="/" className="logo" style={{ display: 'block', width: '150px' }}>
              <img src={logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </a>
          </div>

          {/* Desktop Navigation - REMOVED */}

          {/* Logout Button */}
          <div className="flex items-center space-x-4">
            <button onClick={handleLogout} className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-[#c4d82e] to-[#b5c928] hover:from-[#b5c928] hover:to-[#a6c025] text-black px-6 py-2.5 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-[#c4d82e]/30 hover:scale-105 active:scale-95">
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>

            {/* Mobile Menu Button - REMOVED */}
          </div>
        </div>

        {/* Mobile Navigation - REMOVED */}
      </div>
    </header>
  );
}

export default TopBar;
