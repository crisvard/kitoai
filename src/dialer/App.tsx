import { useState } from 'react';
import { Phone, Users, Clock, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ContactsTable from './components/ContactsTable';
import Settings from './components/Settings';
import CallHistory from './components/CallHistory';
import { DialerProvider } from './contexts/DialerContext';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Phone },
    { id: 'contacts', label: 'Contatos', icon: Users },
    { id: 'history', label: 'Histórico', icon: Clock },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon },
  ];

  return (
    <DialerProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Bland Dialer</h1>
                  <p className="text-sm text-gray-600">Sistema de Discador Inteligente</p>
                </div>
              </div>
            </div>
            
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'contacts' && <ContactsTable />}
          {activeTab === 'history' && <CallHistory />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
    </DialerProvider>
  );
}

export default App;