import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('send-reset-email', {
        body: { email }
      });

      if (functionError) throw functionError;

      if (data?.success) {
        setSuccess(true);
        setEmail('');
      } else {
        throw new Error(data?.error || 'Erro ao enviar email');
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError(err.message || 'Erro ao enviar email de recuperação');
    } finally {
      setLoading(false);
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
        <a href="http://localhost:5173/" style={{ display: 'block', textDecoration: 'none' }}>
          <img
            src="/src/assets/logo1.png"
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
          Esqueceu a senha?
        </h1>
        <p style={{ marginBottom: '10px' }}>
          Digite seu email para receber um link de recuperação
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
            <p style={{ margin: 0, fontWeight: 'bold' }}>Email enviado com sucesso!</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
              Verifique sua caixa de entrada e spam. O link expira em 1 hora.
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
      <form onSubmit={handleSubmit} style={{
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

        <button
          type="submit"
          disabled={loading || !email}
          style={{
            all: 'unset',
            padding: '10px',
            borderRadius: '15px',
            backgroundColor: '#fff',
            color: '#1C1C1E',
            cursor: 'pointer',
            width: '100%',
            opacity: (loading || !email) ? 0.6 : 1,
            pointerEvents: (loading || !email) ? 'none' : 'auto'
          }}
        >
          {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
        </button>
      </form>

      {/* Back to Login */}
      <div style={{ marginTop: '20px' }}>
        <Link
          to="/login"
          style={{
            color: '#c9f31d',
            textDecoration: 'underline',
            fontSize: '14px'
          }}
        >
          ← Voltar para login
        </Link>
      </div>

      {/* Additional Info */}
      <div style={{
        marginTop: '30px',
        fontSize: 'small',
        color: '#717171',
        maxWidth: '400px'
      }}>
        <p>Não recebeu o email? Verifique sua pasta de spam ou tente novamente.</p>
      </div>
    </div>
  );
}