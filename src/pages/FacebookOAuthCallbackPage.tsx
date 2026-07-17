import { useEffect } from 'react';

/**
 * Página de callback OAuth do Facebook (Meta Embedded Signup).
 *
 * O Facebook redireciona o popup para:
 *   /oauth/facebook/callback?code=...&state=...
 *
 * Esta página lê os parâmetros e faz postMessage de volta para a janela pai,
 * depois fecha o popup. Deve ser acessível sem autenticação.
 */
export default function FacebookOAuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (window.opener) {
      window.opener.postMessage(
        {
          type: 'fb_oauth_callback',
          code: code ?? undefined,
          state: state ?? undefined,
          error: error ?? undefined,
          errorDescription: errorDescription ?? undefined,
        },
        window.location.origin
      );
      window.close();
    } else {
      // Fallback: se não houver janela pai, redireciona para home
      window.location.href = '/';
    }
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '4px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#6b7280', fontSize: 14 }}>Conectando com a Meta...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
