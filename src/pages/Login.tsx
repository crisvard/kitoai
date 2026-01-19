import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfessionalAuth } from '../scheduler/contexts/ProfessionalAuthContext';
import { useSEO } from '../hooks/useSEO';
import logo from '../assets/logo1.png';

type LoginMode = 'admin' | 'professional';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('admin');
  const { signIn } = useAuth();
  const { login: professionalLogin } = useProfessionalAuth();
  const navigate = useNavigate();

  // SEO configuration
  useSEO({
    title: 'Login - Kito AI Dashboard',
    description: 'Acesse sua conta no Kito AI - Plataforma completa de vendas com inteligência artificial.',
    keywords: 'login, Kito AI, dashboard, vendas, IA'
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      if (loginMode === 'admin') {
        await signIn(email, password);
        console.log('✅ Login de admin bem-sucedido no Dashboard');
        navigate('/dashboard');
      } else {
        const success = await professionalLogin(email, password);
        if (success) {
          console.log('✅ Login de profissional bem-sucedido no Dashboard');
          // O redirecionamento será feito automaticamente pelo AppContent
        } else {
          alert('Credenciais inválidas para profissional');
        }
      }
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      alert('Erro ao fazer login: ' + (error.message || 'Tente novamente'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#1E1E20',
      color: '#717171',
      fontFamily: 'Inter, sans-serif',
      margin: 0,
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Background blur elements */}
      <div style={{
        position: 'absolute',
        width: '200px',
        height: '200px',
        backgroundColor: '#717171',
        top: 0,
        right: 0,
        borderRadius: '10px 30px 600px 100px',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        width: '200px',
        height: '200px',
        backgroundColor: '#717171',
        bottom: 0,
        left: 0,
        borderRadius: '100px 30px 600px 100px',
        filter: 'blur(100px)',
        pointerEvents: 'none'
      }}></div>

      {/* Header */}
      <header style={{ marginBottom: '30px' }}>
        <a href="/" style={{ display: 'block', textDecoration: 'none' }}>
          <img
            src={logo}
            alt="Kito Expert Logo"
            style={{
              width: '240px',
              height: 'auto',
              margin: 'auto',
              display: 'block',
              marginBottom: '30px'
            }}
          />
        </a>
        <h1 style={{
          fontWeight: 500,
          color: '#fff',
          fontSize: 'x-large',
          marginBottom: '10px'
        }}>
          {loginMode === 'admin' ? 'Bem-vindo ao Dashboard' : 'Login do Profissional'}
        </h1>
        <p style={{ marginBottom: '10px' }}>
          {loginMode === 'admin' ? (
            <>Primeiro acesso? <a href="/register" style={{ color: '#c9f31d', textDecoration: 'underline' }}>Faça seu cadastro</a></>
          ) : (
            <>Login exclusivo para profissionais cadastrados</>
          )}
        </p>

        {/* Toggle between admin and professional login */}
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setLoginMode(loginMode === 'admin' ? 'professional' : 'admin')}
            style={{
              all: 'unset',
              padding: '8px 16px',
              borderRadius: '20px',
              backgroundColor: loginMode === 'admin' ? '#c9f31d' : '#717171',
              color: loginMode === 'admin' ? '#1C1C1E' : '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            {loginMode === 'admin' ? '👤 Sou Profissional' : '🏢 Sou Administrador'}
          </button>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleLogin} style={{
        display: 'flex',
        margin: 'auto',
        marginBlock: '30px',
        width: 'min(300px, 90vw)',
        gap: '15px',
        flexWrap: 'wrap'
      }}>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu email"
          required
          style={{
            all: 'unset',
            padding: '10px',
            borderRadius: '15px',
            backgroundColor: '#1C1C1E',
            boxShadow: '0 10px 30px #0005',
            border: '1px solid #71717188',
            transition: 'background-image 0.5s, opacity .5s, border .5s',
            color: '#fff',
            width: '100%'
          }}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          minLength={6}
          required
          style={{
            all: 'unset',
            padding: '10px',
            borderRadius: '15px',
            backgroundColor: '#1C1C1E',
            boxShadow: '0 10px 30px #0005',
            border: '1px solid #71717188',
            transition: 'background-image 0.5s, opacity .5s, border .5s',
            color: '#fff',
            width: '100%'
          }}
        />

        <p style={{
          fontSize: 'small',
          textAlign: 'left',
          color: '#717171',
          width: '100%'
        }}>
          A senha deve ter pelo menos 6 caracteres
        </p>

        <div style={{
          width: '100%',
          textAlign: 'right',
          marginBottom: '10px'
        }}>
          <Link 
            to="/forgot-password" 
            style={{ 
              color: '#c9f31d', 
              textDecoration: 'underline', 
              fontSize: 'small' 
            }}
          >
            Esqueceu a senha?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading || !email || !password}
          style={{
            all: 'unset',
            padding: '10px',
            borderRadius: '15px',
            backgroundColor: '#fff',
            color: '#1C1C1E',
            cursor: 'pointer',
            width: '100%',
            opacity: (isLoading || !email || !password) ? 0.6 : 1,
            pointerEvents: (isLoading || !email || !password) ? 'none' : 'auto'
          }}
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};

export default Login;