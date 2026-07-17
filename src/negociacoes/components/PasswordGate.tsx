import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PasswordGateProps {
    children: React.ReactNode;
}

const SESSION_KEY = 'negociacoes_unlocked';

export default function PasswordGate({ children }: PasswordGateProps) {
    const [unlocked, setUnlocked] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    // Verifica se já foi desbloqueado nesta sessão
    useEffect(() => {
        const session = sessionStorage.getItem(SESSION_KEY);
        if (session === 'true') {
            setUnlocked(true);
        }
        setChecking(false);
    }, []);

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) return;

        setLoading(true);
        setError('');

        try {
            const { data, error: dbError } = await supabase
                .from('negociacoes_config')
                .select('senha')
                .eq('chave', 'senha_acesso')
                .single();

            if (dbError || !data) {
                setError('Erro ao verificar senha. Tente novamente.');
                setLoading(false);
                return;
            }

            if (data.senha === password) {
                sessionStorage.setItem(SESSION_KEY, 'true');
                setUnlocked(true);
            } else {
                setError('Senha incorreta. Tente novamente.');
            }
        } catch {
            setError('Erro de conexão. Verifique sua internet.');
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div style={styles.overlay}>
                <div style={styles.spinner} />
            </div>
        );
    }

    if (unlocked) {
        return <>{children}</>;
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                {/* Logo / ícone */}
                <div style={styles.iconWrapper}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>

                <h1 style={styles.title}>Agente de Negociações</h1>
                <p style={styles.subtitle}>Digite a senha para acessar</p>

                <form onSubmit={handleUnlock} style={styles.form}>
                    <div style={styles.inputWrapper}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={styles.input}
                            autoFocus
                            disabled={loading}
                        />
                    </div>

                    {error && <p style={styles.error}>{error}</p>}

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? (
                            <span style={styles.loadingRow}>
                                <span style={styles.dotSpinner} />
                                Verificando…
                            </span>
                        ) : (
                            'Entrar'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: "'Kanit', sans-serif",
    },
    card: {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '380px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
    },
    iconWrapper: {
        background: 'rgba(99,102,241,0.15)',
        borderRadius: '50%',
        width: '80px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '8px',
        border: '1px solid rgba(99,102,241,0.3)',
    },
    title: {
        color: '#ffffff',
        fontSize: '20px',
        fontWeight: 600,
        margin: 0,
        textAlign: 'center',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: '14px',
        margin: 0,
        marginBottom: '8px',
        textAlign: 'center',
    },
    form: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    inputWrapper: {
        width: '100%',
    },
    input: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(255,255,255,0.08)',
        color: '#ffffff',
        fontSize: '18px',
        letterSpacing: '4px',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
    },
    error: {
        color: '#f87171',
        fontSize: '13px',
        margin: 0,
        textAlign: 'center',
        background: 'rgba(239,68,68,0.1)',
        borderRadius: '8px',
        padding: '8px 12px',
    },
    button: {
        width: '100%',
        padding: '14px',
        borderRadius: '12px',
        border: 'none',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#ffffff',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'opacity 0.2s, transform 0.1s',
        fontFamily: "'Kanit', sans-serif",
        letterSpacing: '0.5px',
    },
    loadingRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    },
    dotSpinner: {
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#ffffff',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
    },
    spinner: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#6366f1',
        animation: 'spin 0.7s linear infinite',
    },
};
