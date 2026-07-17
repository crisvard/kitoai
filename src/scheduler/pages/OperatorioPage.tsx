import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Heart, Mail, Lock, User, ArrowRight, Check, Send, Clock } from 'lucide-react';

const OperatorioPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);

  // Estados para verificação de email
  const [showEmailVerification, setShowEmailVerification] = useState(true);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    let interval: NodeJS.Timeout;
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
        alert('Código de confirmação enviado para seu email!');
      } else {
        throw new Error(data.error || 'Erro ao enviar código');
      }
    } catch (error: any) {
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
      // Verificar código na tabela email_verifications
      const { data, error } = await (supabase as any)
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .eq('verification_code', confirmationCode.toUpperCase())
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        alert('Código inválido ou expirado. Verifique e tente novamente.');
        return;
      }

      // Marcar código como usado
      const { error: updateError } = await (supabase as any)
        .from('email_verifications')
        .update({ used_at: new Date().toISOString() })
        .eq('id', data.id);

      if (updateError) {
        console.error('Erro ao marcar código como usado:', updateError);
        // Não falha a verificação por isso
      }

      alert('Email confirmado com sucesso!');
      setShowEmailVerification(false); // Esconde verificação e mostra formulário
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      alert('Erro ao verificar código. Tente novamente.');
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!ageConfirmed) {
      alert('Você precisa confirmar que é maior de 18 anos.');
      return;
    }
    if (!termsAccepted) {
      alert('Você precisa aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }
    if (!emailConsent) {
      alert('Você precisa autorizar o recebimento de emails promocionais.');
      return;
    }

    setIsLoading(true);

    try {
      // Email já foi verificado, agora criar conta no Supabase Auth normalmente
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Aguardar um pouco para garantir que o usuário foi criado
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não foi criado');

      // Salvar perfil no Supabase
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: email,
          business_name: '',
          whatsapp_connected: false,
          whatsapp_number: ''
        });

      if (profileError) {
        console.error('Erro ao salvar perfil:', profileError);
      }

      alert('Conta criada com sucesso! Bem-vindo ao Kito Expert!');
      navigate('/dashboard');

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      alert('Erro ao criar conta: ' + (error.message || 'Tente novamente'));
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading || !ageConfirmed || !termsAccepted || !emailConsent;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-green-900/20"></div>

      {/* Background Images */}
      <div className="absolute top-20 left-10 w-18 h-18 md:w-36 md:h-36 rounded-full overflow-hidden opacity-10 animate-pulse">
        <div className="w-full h-full bg-green-500/20 rounded-full flex items-center justify-center">
          <Heart className="w-10 h-10 text-green-500" fill="currentColor" />
        </div>
      </div>
      <div className="absolute top-10 left-60 w-14 h-14 md:w-28 md:h-28 rounded-full overflow-hidden opacity-12 animate-pulse delay-500">
        <div className="w-full h-full bg-green-500/20 rounded-full flex items-center justify-center">
          <Heart className="w-8 h-8 text-green-500" fill="currentColor" />
        </div>
      </div>
      <div className="absolute top-40 left-96 w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden opacity-8 animate-pulse delay-1000">
        <div className="w-full h-full bg-green-500/20 rounded-full flex items-center justify-center">
          <Heart className="w-10 h-10 text-green-500" fill="currentColor" />
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto p-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Logo and Brand */}
          <div className="flex flex-col justify-center">
            <div className="text-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-green-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
                  <Heart className="w-10 h-10 text-green-500" fill="currentColor" />
                </div>
                <div className="absolute -top-1 -left-1 w-10 h-10 rounded-full overflow-hidden opacity-40">
                  <div className="w-full h-full bg-green-500/20 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-green-500" fill="currentColor" />
                  </div>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-green-500 mb-2">
                Kito Expert
              </h1>
              <p className="text-gray-300">
                Crie sua conta gratuitamente
              </p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl text-white mb-2">Criar Conta</h2>
                <p className="text-slate-400">
                  Junte-se a milhares de profissionais que já otimizam seus negócios
                </p>
              </div>

              {/* Verificação de Email */}
              {showEmailVerification && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Verificação de Email</h3>
                    <p className="text-slate-300">Primeiro, vamos confirmar seu endereço de email</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-green-500" />
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 text-white placeholder:text-slate-400 focus:border-green-500 rounded-lg"
                    />
                  </div>

                  <button
                    onClick={sendConfirmationCode}
                    disabled={isSendingCode || !email}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSendingCode ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Enviando código...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar Código de Confirmação
                      </>
                    )}
                  </button>

                  {/* Formulário de verificação de código */}
                  {timeLeft > 0 && (
                    <div className="space-y-4 border-t border-slate-600 pt-6">
                      <div className="text-center">
                        <h4 className="text-white font-semibold mb-2">Digite o código enviado</h4>
                        <p className="text-slate-300 text-sm">Enviamos um código para <strong>{email}</strong></p>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="confirmationCode" className="text-white flex items-center gap-2">
                          <Mail className="w-4 h-4 text-green-500" />
                          Código de Confirmação
                        </label>
                        <input
                          id="confirmationCode"
                          type="text"
                          value={confirmationCode}
                          onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                          placeholder="Digite o código de 6 dígitos"
                          maxLength={6}
                          className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 text-white placeholder:text-slate-400 focus:border-green-500 rounded-lg text-center text-2xl tracking-widest"
                        />
                      </div>

                      <div className="flex items-center justify-center gap-2 text-slate-300">
                        <Clock className="w-4 h-4" />
                        <span>Código expira em {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setConfirmationCode('');
                            setTimeLeft(0);
                          }}
                          className="flex-1 border border-slate-600 text-slate-300 hover:bg-slate-700 py-3 px-4 rounded-xl"
                        >
                          Voltar
                        </button>
                        <button
                          onClick={verifyConfirmationCode}
                          disabled={isVerifyingCode || confirmationCode.length !== 6}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isVerifyingCode ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              Verificando...
                            </>
                          ) : (
                            'Confirmar Código'
                          )}
                        </button>
                      </div>

                      <button
                        onClick={resendConfirmationCode}
                        disabled={timeLeft > 0}
                        className="w-full text-green-400 hover:text-green-300 disabled:text-slate-500 py-2"
                      >
                        Reenviar código {timeLeft > 0 && `(${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')})`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Formulário de Cadastro (aparece após verificação) */}
              {!showEmailVerification && (
                <form onSubmit={handleSignup} className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Complete seu Cadastro</h3>
                    <p className="text-slate-300">Email confirmado! Agora preencha os dados restantes</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-green-500" />
                      Nome Completo
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                      required
                      className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 text-white placeholder:text-slate-400 focus:border-green-500 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-green-500" />
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 text-white opacity-50 cursor-not-allowed rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-green-500" />
                      Senha
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 text-white placeholder:text-slate-400 focus:border-green-500 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-green-500" />
                      Confirmar Senha
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 text-white placeholder:text-slate-400 focus:border-green-500 rounded-lg"
                    />
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center space-x-3">
                      <input
                        id="age"
                        type="checkbox"
                        checked={ageConfirmed}
                        onChange={(e) => setAgeConfirmed(e.target.checked)}
                        className="border-slate-600 rounded"
                      />
                      <label htmlFor="age" className="text-sm font-medium leading-none text-white cursor-pointer">
                        Declaro ser maior de 18 anos.
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        id="terms"
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="border-slate-600 rounded"
                      />
                      <label htmlFor="terms" className="text-sm font-medium leading-none text-white cursor-pointer">
                        Eu li e aceito os{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            // TODO: Implementar modal de termos
                          }}
                          className="underline text-green-400 hover:text-green-300 ml-1"
                        >
                          Termos de Uso e a Política de Privacidade
                        </button>
                        .
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        id="emailConsent"
                        type="checkbox"
                        checked={emailConsent}
                        onChange={(e) => setEmailConsent(e.target.checked)}
                        className="border-slate-600 rounded"
                      />
                      <label htmlFor="emailConsent" className="text-sm font-medium leading-none text-white cursor-pointer">
                        Autorizo o recebimento de emails promocionais e de marketing.
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isButtonDisabled}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Criando conta...
                      </>
                    ) : (
                      <>
                        <User className="w-5 h-5" />
                        Criar Conta
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center">
                <p className="text-slate-400">
                  Já tem uma conta?{' '}
                  <Link
                    to="/login"
                    className="text-green-500 hover:text-green-400 font-medium transition-colors"
                  >
                    Fazer login
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Card de informações */}
          <div className="flex flex-col justify-center">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Por que escolher Kito Expert?</h2>
              <p className="text-slate-300">Veja o que você terá acesso</p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 border-2 border-green-500/50 rounded-lg p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl text-white">Sistema Completo</h3>
                <p className="text-slate-400">Gerencie agendamentos, clientes e serviços</p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-white">Agendamento online</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-white">Gestão de clientes</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-white">Controle financeiro</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-white">Relatórios detalhados</span>
                </li>
              </ul>

              <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-green-400 text-sm text-center">
                  ✨ Comece gratuitamente e tenha acesso completo ao sistema!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorioPage;