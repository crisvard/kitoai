import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import Trading from './components/Trading';
import Exchanges from './components/Exchanges';
import Transactions from './components/Transactions';
import BrokerDashboard from './components/BrokerDashboard';
import BrokerPortfolio from './components/BrokerPortfolio';
import BrokerTrading from './components/BrokerTrading';
import BrokerBrokers from './components/BrokerBrokers';
import BrokerTransactions from './components/BrokerTransactions';
import BettingDashboard from './components/BettingDashboard';
import BettingBets from './components/BettingBets';
import BettingAnalysis from './components/BettingAnalysis';
import BettingBookmakers from './components/BettingBookmakers';
import BettingStats from './components/BettingStats';
import BookmakerMirror from './components/BookmakerMirror';
import OtherDashboard from './components/OtherDashboard';
import { OtherNavProvider } from './contexts/OtherNavContext';
import PasswordGate from './components/PasswordGate';

function App() {
  const [activeTab, setActiveTab] = useState('crypto');
  const [activeView, setActiveView] = useState('crypto-dashboard');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Define a view padrão para cada tab
    switch (tab) {
      case 'crypto':
        setActiveView('crypto-dashboard');
        break;
      case 'broker':
        setActiveView('broker-dashboard');
        break;
      case 'betting':
        setActiveView('betting-dashboard');
        break;
      case 'other':
        setActiveView('other-dashboard');
        break;
    }
  };

  const renderView = () => {
    // Criptomoedas
    if (activeTab === 'crypto') {
      switch (activeView) {
        case 'crypto-dashboard':
          return <Dashboard />;
        case 'crypto-portfolio':
          return <Portfolio />;
        case 'crypto-trading':
          return <Trading />;
        case 'crypto-exchanges':
          return <Exchanges />;
        case 'crypto-transactions':
          return <Transactions />;
        default:
          return <Dashboard />;
      }
    }

    // Broker
    if (activeTab === 'broker') {
      switch (activeView) {
        case 'broker-dashboard':
          return <BrokerDashboard />;
        case 'broker-portfolio':
          return <BrokerPortfolio />;
        case 'broker-trading':
          return <BrokerTrading />;
        case 'broker-brokers':
          return <BrokerBrokers />;
        case 'broker-transactions':
          return <BrokerTransactions />;
        default:
          return <BrokerDashboard />;
      }
    }

    // Casas de Apostas
    if (activeTab === 'betting') {
      switch (activeView) {
        case 'betting-dashboard':
          return <BettingDashboard />;
        case 'betting-bets':
          return <BettingBets />;
        case 'betting-analysis':
          return <BettingAnalysis />;
        case 'betting-bookmakers':
          return <BettingBookmakers />;
        case 'betting-stats':
          return <BettingStats />;
        case 'betting-betano':
          return <BookmakerMirror />;
        default:
          return <BettingDashboard />;
      }
    }

    // Outros
    if (activeTab === 'other') {
      switch (activeView) {
        case 'other-dashboard':
          return <OtherDashboard />;
        default:
          return <OtherDashboard />;
      }
    }

    return <Dashboard />;
  };

  return (
    <PasswordGate>
      <OtherNavProvider>
        <Layout
          activeTab={activeTab}
          activeView={activeView}
          onTabChange={handleTabChange}
          onViewChange={setActiveView}
        >
          {renderView()}
        </Layout>
      </OtherNavProvider>
    </PasswordGate>
  );
}

export default App;
