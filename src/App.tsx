import React from 'react';
import { createBrowserRouter, RouterProvider, useNavigate, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProfessionalAuthProvider, useProfessionalAuth } from './scheduler/contexts/ProfessionalAuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import CompleteRegister from './pages/CompleteRegister';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import TrialConfirmationPage from './pages/TrialConfirmationPage';
import TrialMarketingPage from './pages/TrialMarketingPage';
import TrialNegociacoesPage from './pages/TrialNegociacoesPage';
import TrialLigacoesPage from './pages/TrialLigacoesPage';
import DirectPaymentPage from './pages/DirectPaymentPage';
import Dashboard from './components/Dashboard';
import AccountDashboard from './components/AccountDashboard';
import PrivateRoute from './components/PrivateRoute';
import WhatsappPage from './pages/WhatsappPage';
import WhatsAppSetupPage from './pages/WhatsAppSetupPage';
import DevelopmentPage from './pages/DevelopmentPage';
import DialerPage from './pages/DialerPage';
import SchedulerPage from './pages/SchedulerPage';
import FranchisePage from './pages/FranchisePage';
import FranchiseSchedulerPage from './pages/FranchiseSchedulerPage';
import WebsitePage from './pages/WebsitePage';
import LandingPage from './pages/LandingPage';
import MarketingPage from './pages/MarketingPage';
import NegociacoesPage from './pages/NegociacoesPage';
import ProfessionalDashboardPage from './scheduler/pages/ProfessionalDashboardPage';
import { FranchiseProvider, useFranchise } from './contexts/FranchiseContext';
import { PermissionsProvider } from './contexts/PermissionsContext';

// Component to check auth status
function AuthStatusChecker() {
  const { user } = useAuth();
  return <div data-auth-status={user ? 'authenticated' : 'not-authenticated'} />;
}

// Componente principal da aplicação
function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { professional, loading: profLoading } = useProfessionalAuth();

  if (authLoading || profLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Professional login flow
  if (professional) {
    return <ProfessionalDashboardPage />;
  }

  // Admin login flow - redirect to login if not authenticated
  if (!user) {
    return (
      <RouterProvider router={createBrowserRouter([
        {
          path: '/auth-status',
          element: <AuthStatusChecker />,
        },
        {
          path: '/',
          element: <Login />,
        },
        {
          path: '/login',
          element: <Login />,
        },
        {
          path: '/register',
          element: <Register />,
        },
        {
          path: '/complete-register',
          element: <CompleteRegister />,
        },
        {
          path: '/forgot-password',
          element: <ForgotPasswordPage />,
        },
        {
          path: '/reset-password',
          element: <ResetPasswordPage />,
        },
        {
          path: '*',
          element: <Login />,
        },
      ])} />
    );
  }

  // Admin authenticated - show main app
  return (
    <RouterProvider router={createBrowserRouter([
      {
        path: '/auth-status',
        element: <AuthStatusChecker />,
      },
      {
        path: '/dashboard',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <DashboardWrapper />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/account',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <AccountDashboardWrapper />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/whatsapp',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <WhatsappPageWrapper />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/whatsapp-setup',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <WhatsAppSetupPageWrapper />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/development',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <DevelopmentPageWrapper />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/franchises',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <FranchisePageWrapper />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/websites',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <WebsitePageWrapper />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/landing-pages',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <LandingPageWrapper />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/marketing',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <MarketingPageWrapper />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/negociacoes',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <NegociacoesPageWrapper />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/franchise/:franchiseId/scheduler',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <FranchiseSchedulerPageWrapper />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/dialer',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <DialerPageWrapper />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/trial-confirmation',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <TrialConfirmationPage />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/trial-marketing',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <TrialMarketingPage />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/trial-negociacoes',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <TrialNegociacoesPage />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/trial-ligacoes',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <TrialLigacoesPage />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/direct-payment',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <DirectPaymentPage />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/scheduler',
        element: (
          <PermissionsProvider>
            <PrivateRoute>
              <FranchiseProvider>
                <SchedulerPageWrapper />
              </FranchiseProvider>
            </PrivateRoute>
          </PermissionsProvider>
        ),
      },
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ])} />
  );
}

// Componente wrapper para passar navigate para Dashboard
function DashboardWrapper() {
  const navigate = useNavigate();

  const handleNavigateToAccount = () => {
    navigate('/account');
  };

  const handleNavigateToWhatsapp = () => {
    navigate('/whatsapp');
  };

  const handleNavigateToWhatsAppSetup = () => {
    navigate('/whatsapp-setup');
  };

  const handleNavigateToDialer = () => {
    navigate('/dialer');
  };

  const handleNavigateToScheduler = () => {
    navigate('/scheduler');
  };

  const handleNavigateToFranchises = () => {
    navigate('/franchises');
  };

  const handleNavigateToWebsites = () => {
    navigate('/websites');
  };

  const handleNavigateToLandingPages = () => {
    navigate('/landing-pages');
  };

  return <Dashboard
    onNavigateToAccount={handleNavigateToAccount}
    onNavigateToWhatsapp={handleNavigateToWhatsapp}
    onNavigateToWhatsAppSetup={handleNavigateToWhatsAppSetup}
    onNavigateToDialer={handleNavigateToDialer}
    onNavigateToScheduler={handleNavigateToScheduler}
    onNavigateToFranchises={handleNavigateToFranchises}
    onNavigateToWebsites={handleNavigateToWebsites}
    onNavigateToLandingPages={handleNavigateToLandingPages}
  />;
}

// Componente wrapper para AccountDashboard
function AccountDashboardWrapper() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return <AccountDashboard onBack={handleBack} />;
}

// Componente wrapper para WhatsappPage
function WhatsappPageWrapper() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return <WhatsappPage onBack={handleBack} />;
}

// Componente wrapper para WhatsAppSetupPage
function WhatsAppSetupPageWrapper() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return <WhatsAppSetupPage onBack={handleBack} />;
}

// Componente wrapper para DevelopmentPage
function DevelopmentPageWrapper() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return <DevelopmentPage onBack={handleBack} />;
}

// Componente wrapper para DialerPage
function DialerPageWrapper() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return <DialerPage onBack={handleBack} />;
}

// Componente wrapper para SchedulerPage
function SchedulerPageWrapper() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return <SchedulerPage onBack={handleBack} />;
}

// Componente wrapper para FranchisePage
function FranchisePageWrapper() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return <FranchisePage onBack={handleBack} />;
}

// Componente wrapper para FranchiseSchedulerPage
const FranchiseSchedulerPageWrapper = () => {
  const navigate = useNavigate();
  const { franchiseId } = useParams<{ franchiseId: string }>();
  const [franchise, setFranchise] = React.useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadFranchise = async () => {
      if (!franchiseId) {
        setLoading(false);
        return;
      }

      try {
        // Importar supabase dinamicamente para evitar problemas de contexto
        const { supabase } = await import('./lib/supabase');

        const { data, error } = await supabase
          .from('franchises')
          .select('id, name')
          .eq('id', franchiseId)
          .single();

        if (error) {
          console.error('Erro ao carregar franquia:', error);
        } else if (data) {
          setFranchise(data);
        }
      } catch (error) {
        console.error('Erro ao carregar franquia:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFranchise();
  }, [franchiseId]);

  const handleBack = () => {
    navigate('/franchises');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center">
        <div className="text-white text-xl">Carregando franquia...</div>
      </div>
    );
  }

  if (!franchise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center">
        <div className="text-white text-xl">Franquia não encontrada</div>
      </div>
    );
  }

  return (
    <FranchiseSchedulerPage
      franchiseId={franchise.id}
      franchiseName={franchise.name}
      onBack={handleBack}
    />
  );
};

// Componente wrapper para WebsitePage
function WebsitePageWrapper() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return <WebsitePage onBack={handleBack} />;
}

// Componente wrapper para LandingPage
function LandingPageWrapper() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return <LandingPage onBack={handleBack} />;
}

// Componente wrapper para MarketingPage
function MarketingPageWrapper() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return <MarketingPage onBack={handleBack} />;
}

// Componente wrapper para NegociacoesPage
function NegociacoesPageWrapper() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return <NegociacoesPage onBack={handleBack} />;
}

function App() {
  return (
    <AuthProvider>
      <ProfessionalAuthProvider>
        <AppContent />
      </ProfessionalAuthProvider>
    </AuthProvider>
  );
}

export default App;
