import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface CreditCardFormProps {
  clientSecret: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
}

const CreditCardForm: React.FC<CreditCardFormProps> = ({ clientSecret, onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe não carregado');
      return;
    }

    setLoading(true);
    setError('');

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Elemento do cartão não encontrado');
      return;
    }

    try {
      // Confirmar o PaymentIntent no Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Erro no pagamento');
      }

      if (!paymentIntent) {
        throw new Error('PaymentIntent não retornado');
      }

      // Se confirmou, chamar callback com o ID do PaymentIntent
      onPaymentSuccess(paymentIntent.id);

    } catch (err: any) {
      console.error('❌ [STRIPE] Erro:', err);
      setError(`Erro ao processar pagamento: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
      <h3 className="text-xl font-bold text-white mb-6">
        Dados do Cartão de Crédito
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Dados do Cartão
          </label>
          <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus-within:border-[#c4d82e]/50 transition-all duration-200">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#ffffff',
                    '::placeholder': {
                      color: '#9ca3af',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-100/10 border border-red-400/20 text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full relative overflow-hidden font-bold py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
            !loading
              ? 'bg-gradient-to-r from-[#c4d82e] to-[#b5c928] hover:from-[#b5c928] hover:to-[#a6c025] text-black hover:shadow-[#c4d82e]/40'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span className="relative z-10">
            {loading ? 'Processando Pagamento...' : 'Processar Pagamento'}
          </span>
          {!loading && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreditCardForm;