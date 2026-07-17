import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import logo from '../assets/logo1.png';

const Register = () => {
  const [email, setEmail] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showCodeInput, setShowCodeInput] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Função para enviar código de confirmação
  const sendConfirmationCode = async () => {
    if (!email || !email.includes('@')) {
      alert('Por favor, insira um email válido');
      return;
    }

    setIsSendingCode(true);
    try {
      // Chamar função Supabase para enviar código
      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { email }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setTimeLeft(10 * 60); // 10 minutos em segundos
        setShowCodeInput(true);
        alert('Código de confirmação enviado para seu email!');
      } else {
        throw new Error(data.error || 'Erro ao enviar código');
      }
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      alert('Erro ao enviar código de confirmação. Tente novamente.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // Função para verificar código
  const verifyConfirmationCode = async () => {
    if (!confirmationCode) {
      alert('Por favor, insira o código de confirmação');
      return;
    }

    setIsVerifyingCode(true);
    try {
      // Chamar função Supabase para verificar código
      const { data, error } = await supabase.functions.invoke('verify-verification-code', {
        body: {
          email: email,
          code: confirmationCode
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        alert('Email confirmado com sucesso!');
        // Redirecionar para página de completar cadastro com email
        navigate('/complete-register', { state: { email } });
      } else {
        throw new Error(data.error || 'Código inválido ou expirado');
      }
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      alert('Código inválido ou expirado. Verifique e tente novamente.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Função para reenviar código
  const resendConfirmationCode = async () => {
    if (timeLeft > 0) {
      alert(`Aguarde ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')} para reenviar`);
      return;
    }
    await sendConfirmationCode();
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
        }}>Cadastro</h1>
        <p style={{ marginBottom: '10px' }}>
          Primeiro acesso? <span style={{ color: '#fff' }}>Faça seu cadastro</span>
        </p>
      </header>

      {/* Form */}
      <form onSubmit={(e) => { e.preventDefault(); sendConfirmationCode(); }} style={{
        display: 'flex',
        margin: 'auto',
        marginBlock: '30px',
        width: 'min(300px, 90vw)',
        gap: '15px',
        flexWrap: 'wrap'
      }}>

        {/* Verificação de Email */}
        <>
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
            disabled={isSendingCode || !email}
            style={{
              all: 'unset',
              padding: '10px',
              borderRadius: '15px',
              backgroundColor: '#fff',
              color: '#1C1C1E',
              cursor: 'pointer',
              width: '100%',
              opacity: (isSendingCode || !email) ? 0.6 : 1,
              pointerEvents: (isSendingCode || !email) ? 'none' : 'auto'
            }}
          >
            {isSendingCode ? 'Enviando código...' : 'Enviar Código de Verificação'}
          </button>

          {/* Código de Verificação */}
          {showCodeInput && (
            <>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                placeholder="Código de 6 dígitos"
                maxLength={6}
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
                  textAlign: 'center',
                  fontSize: '18px',
                  letterSpacing: '2px'
                }}
              />

              <p style={{
                fontSize: 'small',
                textAlign: 'center',
                color: '#717171',
                width: '100%'
              }}>
                Código expira em {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </p>

              <button
                type="button"
                onClick={verifyConfirmationCode}
                disabled={isVerifyingCode || confirmationCode.length !== 6}
                style={{
                  all: 'unset',
                  padding: '10px',
                  borderRadius: '15px',
                  backgroundColor: '#fff',
                  color: '#1C1C1E',
                  cursor: 'pointer',
                  width: '100%',
                  opacity: (isVerifyingCode || confirmationCode.length !== 6) ? 0.6 : 1,
                  pointerEvents: (isVerifyingCode || confirmationCode.length !== 6) ? 'none' : 'auto'
                }}
              >
                {isVerifyingCode ? 'Verificando...' : 'Confirmar Código'}
              </button>

              <button
                type="button"
                onClick={resendConfirmationCode}
                disabled={timeLeft > 0}
                style={{
                  all: 'unset',
                  padding: '10px',
                  borderRadius: '15px',
                  backgroundColor: 'transparent',
                  color: '#717171',
                  cursor: 'pointer',
                  width: '100%',
                  textDecoration: 'underline',
                  opacity: timeLeft > 0 ? 0.6 : 1,
                  pointerEvents: timeLeft > 0 ? 'none' : 'auto'
                }}
              >
                Reenviar código {timeLeft > 0 && `(${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')})`}
              </button>
            </>
          )}
        </>

        <div style={{
          position: 'relative',
          width: '100%',
          textAlign: 'center',
          margin: '20px 0'
        }}>
          <span style={{
            backgroundColor: '#1E1E20',
            padding: '0 10px',
            color: '#717171'
          }}>ou</span>
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '1px',
            left: 0,
            top: '45%',
            backgroundImage: 'linear-gradient(to right, #71717155 0 40%, transparent 40% 60%, #71717155 60%)'
          }}></div>
        </div>

        <a href="/login" style={{
          color: '#fff',
          textDecoration: 'none',
          width: '100%',
          textAlign: 'center',
          fontSize: 'small'
        }}>
          Já tem conta? Fazer login
        </a>
      </form>
    </div>
  );
};

export default Register;