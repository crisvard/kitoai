import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo1.png';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Token inválido. Por favor, solicite um novo link de recuperação.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const validatePassword = () => {
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePassword()) return;

    setLoading(true);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('reset-password', {
        body: {
          token,
          newPassword: password
        }
      });

      if (functionError) throw functionError;

      if (data?.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        throw new Error(data?.error || 'Erro ao resetar senha');
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError(err.message || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  if (!token && !error) {
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

        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #717171',
          borderTop: '4px solid #c9f31d',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '20px' }}>Carregando...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

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
        <a href="http://localhost:5173/" style={{ display: 'block', textDecoration: 'none' }}>
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
          Nova Senha
        </h1>
        <p style={{ marginBottom: '10px' }}>
          Digite sua nova senha abaixo
        </p>
      </header>

      {/* Success Message */}
      {success && (
        <div style={{
          backgroundColor: '#10B981',
          color: '#fff',
          padding: '15px',
          borderRadius: '15px',
          marginBottom: '20px',
          maxWidth: '400px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle size={20} />
          <div>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Senha atualizada com sucesso!</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
              Redirecionando para o login...
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#EF4444',
          color: '#fff',
          padding: '15px',
          borderRadius: '15px',
          marginBottom: '20px',
          maxWidth: '400px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={20} />
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Form */}
      {!success && token && (
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          margin: 'auto',
          marginBlock: '30px',
          width: 'min(300px, 90vw)',
          gap: '15px',
          flexWrap: 'wrap'
        }}>

          <div style={{ width: '100%' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nova senha"
              required
              minLength={6}
              style={{
                all: 'unset',
                padding: '10px',
                borderRadius: '15px',
                backgroundColor: '#1C1C1E',
                boxShadow: '0 10px 30px #0005',
                border: '1px solid #71717188',
                transition: 'background-image 0.5s, opacity .5s, border .5s',
                color: '#fff',
                width: '100%',
                marginBottom: '10px'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                all: 'unset',
                color: '#717171',
                cursor: 'pointer',
                fontSize: '12px',
                marginLeft: '10px'
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div style={{ width: '100%' }}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar senha"
              required
              minLength={6}
              style={{
                all: 'unset',
                padding: '10px',
                borderRadius: '15px',
                backgroundColor: '#1C1C1E',
                boxShadow: '0 10px 30px #0005',
                border: '1px solid #71717188',
                transition: 'background-image 0.5s, opacity .5s, border .5s',
                color: '#fff',
                width: '100%',
                marginBottom: '10px'
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                all: 'unset',
                color: '#717171',
                cursor: 'pointer',
                fontSize: '12px',
                marginLeft: '10px'
              }}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <p style={{
            fontSize: 'small',
            textAlign: 'center',
            color: '#717171',
            width: '100%'
          }}>
            A senha deve ter pelo menos 6 caracteres
          </p>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            style={{
              all: 'unset',
              padding: '10px',
              borderRadius: '15px',
              backgroundColor: '#fff',
              color: '#1C1C1E',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'center',
              opacity: (loading || !password || !confirmPassword) ? 0.6 : 1,
              pointerEvents: (loading || !password || !confirmPassword) ? 'none' : 'auto'
            }}
          >
            {loading ? 'Atualizando...' : 'Atualizar Senha'}
          </button>
        </form>
      )}
    </div>
  );
}