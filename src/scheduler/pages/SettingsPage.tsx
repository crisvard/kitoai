import ProfessionalsManager from '../components/Settings/ProfessionalsManager';
import ServicesManager from '../components/Settings/ServicesManager';
import CustomersManager from '../components/Settings/CustomersManager';
import PackagesManager from '../components/Settings/PackagesManager';
import CommissionManager from '../components/Settings/CommissionManager';
import WorkingHoursManager from '../components/Settings/WorkingHoursManager';
import { useScheduler } from '../contexts/SchedulerContext';

export default function SettingsPage() {
  const { settingsTab, setSettingsTab } = useScheduler() as {
    settingsTab: 'professionals' | 'services' | 'customers' | 'packages' | 'commissions' | 'working-hours';
    setSettingsTab: (tab: 'professionals' | 'services' | 'customers' | 'packages' | 'commissions' | 'working-hours') => void;
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
          <p className="text-gray-400">Gerencie profissionais, serviços, clientes e pacotes</p>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
          <div className="border-b border-white/10">
            <nav className="flex">
              <button
                onClick={() => setSettingsTab('professionals')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  settingsTab === 'professionals'
                    ? 'border-[#c4d82e] text-[#c4d82e]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Profissionais
              </button>
              <button
                onClick={() => setSettingsTab('services')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  settingsTab === 'services'
                    ? 'border-[#c4d82e] text-[#c4d82e]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Serviços
              </button>
              <button
                onClick={() => setSettingsTab('customers')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  settingsTab === 'customers'
                    ? 'border-[#c4d82e] text-[#c4d82e]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Clientes
              </button>
              <button
                onClick={() => setSettingsTab('packages')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  settingsTab === 'packages'
                    ? 'border-[#c4d82e] text-[#c4d82e]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Pacotes
              </button>
              <button
                onClick={() => setSettingsTab('commissions')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  settingsTab === 'commissions'
                    ? 'border-[#c4d82e] text-[#c4d82e]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Comissões
              </button>
              <button
                onClick={() => setSettingsTab('working-hours')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  settingsTab === 'working-hours'
                    ? 'border-[#c4d82e] text-[#c4d82e]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Horários Disponíveis
              </button>
            </nav>
          </div>

          <div className="p-6">
            {settingsTab === 'professionals' && <ProfessionalsManager />}
            {settingsTab === 'services' && <ServicesManager />}
            {settingsTab === 'customers' && <CustomersManager />}
            {settingsTab === 'packages' && <PackagesManager />}
            {settingsTab === 'commissions' && <CommissionManager />}
            {settingsTab === 'working-hours' && <WorkingHoursManager />}
          </div>
        </div>
      </div>
    </div>
  );
}