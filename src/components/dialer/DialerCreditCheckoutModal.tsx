import React, { useState, useMemo } from 'react';
import { X, Copy, CheckCircle, Smartphone, Info, CreditCard, Loader2, ArrowLeft, Zap } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useStripeKeys } from '../../hooks/useStripeKeys';
import { activatePlan } from '../../lib/services/planService';

// ─── Stripe Card Form ───────────────────────────────────────────────
const StripeCardForm: React.FC<{
    onSuccess: () => void;
    onError: (msg: string) => void;
    packageId: string;
    userId: string;
}> = ({ onSuccess, onError, packageId, userId }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [paying, setPaying] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setPaying(true);
        try {
            const { error: submitError } = await elements.submit();
            if (submitError) throw new Error(submitError.message);

            const { paymentIntent, error: confirmError } = await stripe.confirmPayment({
                elements,
                redirect: 'if_required',
            });

            if (confirmError) throw new Error(confirmError.message);
            if (!paymentIntent) throw new Error('Pagamento não processado');

            // Activate credits FRONTEND-side via planService instead of edge function
            await activatePlan(
                userId,
                packageId,
                paymentIntent.id,
                undefined,
                undefined,
                'stripe'
            );

            onSuccess();
        } catch (err: any) {
            onError(err.message || 'Erro ao processar pagamento');
        } finally {
            setPaying(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            <button
                type="submit"
                disabled={!stripe || paying}
                className="w-full py-4 bg-[#c4d82e] hover:bg-[#b3c62a] disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
                {paying ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
                ) : (
                    <><CreditCard className="w-5 h-5" /> Pagar com Cartão</>
                )}
            </button>
        </form>
    );
};

// ─── Main Modal ─────────────────────────────────────────────────────
interface DialerCreditCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    packageItem: {
        id: string;
        name: string;
        price: number;
        credits_amount: number;
    } | null;
    onSuccess: () => void;
}

type Step = 'method' | 'pix' | 'stripe_loading' | 'stripe_form' | 'success';
type Method = 'PIX' | 'CARD';

const DialerCreditCheckoutModal: React.FC<DialerCreditCheckoutModalProps> = ({
    isOpen,
    onClose,
    packageItem,
    onSuccess,
}) => {
    const { user } = useAuth();
    const { keys: stripeKeys } = useStripeKeys();

    const stripePromise = useMemo(() => {
        if (stripeKeys?.publishableKey) {
            return loadStripe(stripeKeys.publishableKey, { locale: 'pt-BR' });
        }
        return null;
    }, [stripeKeys?.publishableKey]);

    const [step, setStep] = useState<Step>('method');
    const [method, setMethod] = useState<Method>('PIX');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [pixData, setPixData] = useState<{
        qrCodeBase64: string | null;
        payload: string | null;
        paymentId: string;
    } | null>(null);
    const [clientSecret, setClientSecret] = useState('');

    if (!isOpen || !packageItem) return null;

    const handleClose = () => {
        setStep('method');
        setMethod('PIX');
        setError('');
        setPixData(null);
        setClientSecret('');
        onClose();
    };

    const handleCopy = () => {
        if (pixData?.payload) {
            navigator.clipboard.writeText(pixData.payload);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handlePixPayment = async () => {
        if (!user || !packageItem) return;
        setLoading(true);
        setError('');
        try {
            const { data, error: fnError } = await supabase.functions.invoke('create-asaas-payment', {
                body: { planId: packageItem.id, billingType: 'PIX', isDirectPayment: true },
            });

            if (fnError || !data?.success) {
                throw new Error(fnError?.message || data?.error || 'Erro ao criar cobrança PIX');
            }

            setPixData({
                qrCodeBase64: data.qrCodeBase64 || null,
                payload: data.payload || null,
                paymentId: data.payment?.id || data.paymentId,
            });
            setStep('pix');
        } catch (err: any) {
            setError(err.message || 'Erro inesperado');
        } finally {
            setLoading(false);
        }
    };

    const handleCardPayment = async () => {
        if (!user || !packageItem) return;
        setStep('stripe_loading');
        setError('');
        try {
            const { data, error: fnError } = await supabase.functions.invoke('create-stripe-payment-intent', {
                body: {
                    planId: packageItem.id,
                    amount: packageItem.price,
                    installments: 1,
                    userId: user.id,
                },
            });

            if (fnError || !data?.clientSecret) {
                throw new Error(fnError?.message || 'Erro ao criar intent de pagamento');
            }

            setClientSecret(data.clientSecret);
            setStep('stripe_form');
        } catch (err: any) {
            setError(err.message || 'Erro inesperado');
            setStep('method');
        }
    };

    const handleStripeSuccess = () => {
        setStep('success');
        setTimeout(() => {
            onSuccess();
            handleClose();
        }, 2500);
    };

    const handleProceed = () => {
        if (method === 'PIX') {
            handlePixPayment();
        } else {
            handleCardPayment();
        }
    };

    const stripeOptions = clientSecret ? {
        clientSecret,
        appearance: {
            theme: 'night' as const,
            variables: {
                colorPrimary: '#c4d82e',
                colorBackground: '#1a1a1a',
                colorText: '#ffffff',
            },
        },
    } : undefined;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        {(step === 'pix' || step === 'stripe_form') && (
                            <button onClick={() => setStep('method')} className="p-1.5 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-white">Comprar Créditos</h2>
                            <p className="text-sm text-gray-400">{packageItem.name} — {packageItem.credits_amount} créditos</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* === STEP: method === */}
                    {step === 'method' && (
                        <div className="space-y-6">
                            {/* Package summary */}
                            <div className="bg-[#c4d82e]/10 border border-[#c4d82e]/20 rounded-2xl p-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#c4d82e]/20 rounded-xl flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-[#c4d82e]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{packageItem.credits_amount} créditos</p>
                                        <p className="text-xs text-gray-400">{packageItem.name}</p>
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-white">R$ {packageItem.price.toFixed(2)}</p>
                            </div>

                            {/* Payment method selector */}
                            <div>
                                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Método de Pagamento</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setMethod('PIX')}
                                        className={`p-4 rounded-2xl border-2 font-semibold transition-all flex flex-col items-center gap-2 ${method === 'PIX'
                                            ? 'border-[#c4d82e] bg-[#c4d82e]/10 text-white'
                                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                                            }`}
                                    >
                                        <Smartphone className="w-6 h-6" />
                                        PIX
                                        <span className="text-xs font-normal opacity-70">Instantâneo</span>
                                    </button>
                                    <button
                                        onClick={() => setMethod('CARD')}
                                        className={`p-4 rounded-2xl border-2 font-semibold transition-all flex flex-col items-center gap-2 ${method === 'CARD'
                                            ? 'border-[#c4d82e] bg-[#c4d82e]/10 text-white'
                                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                                            }`}
                                    >
                                        <CreditCard className="w-6 h-6" />
                                        Cartão
                                        <span className="text-xs font-normal opacity-70">Crédito</span>
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleProceed}
                                disabled={loading}
                                className="w-full py-4 bg-[#c4d82e] hover:bg-[#b3c62a] disabled:opacity-60 text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
                            >
                                {loading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
                                ) : (
                                    <>Continuar com {method === 'PIX' ? 'PIX' : 'Cartão'}</>
                                )}
                            </button>
                        </div>
                    )}

                    {/* === STEP: pix === */}
                    {step === 'pix' && pixData && (
                        <div className="flex flex-col items-center text-center space-y-5">
                            {pixData.qrCodeBase64 && (
                                <div className="bg-white p-3 rounded-2xl">
                                    <img
                                        src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                                        alt="QR Code PIX"
                                        className="w-52 h-52"
                                    />
                                </div>
                            )}

                            <div>
                                <p className="text-sm text-gray-400 mb-1">Valor a pagar</p>
                                <p className="text-3xl font-black text-white">R$ {packageItem.price.toFixed(2)}</p>
                                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-[#c4d82e]/10 rounded-full border border-[#c4d82e]/20">
                                    <span className="text-xs font-semibold text-[#c4d82e]">{packageItem.credits_amount} CRÉDITOS</span>
                                </div>
                            </div>

                            {pixData.payload && (
                                <button
                                    onClick={handleCopy}
                                    className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all ${copied
                                        ? 'bg-green-500 text-white'
                                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                        }`}
                                >
                                    {copied ? (
                                        <><CheckCircle className="w-5 h-5" /> Copiado!</>
                                    ) : (
                                        <><Copy className="w-5 h-5 text-gray-400" /> Copiar Código PIX</>
                                    )}
                                </button>
                            )}

                            <div className="w-full p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-3 text-left">
                                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Após o pagamento ser confirmado, os créditos serão adicionados automaticamente à sua conta em instantes.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* === STEP: stripe_loading === */}
                    {step === 'stripe_loading' && (
                        <div className="flex flex-col items-center py-12 gap-4">
                            <Loader2 className="w-10 h-10 text-[#c4d82e] animate-spin" />
                            <p className="text-gray-400">Preparando formulário de pagamento...</p>
                        </div>
                    )}

                    {/* === STEP: stripe_form === */}
                    {step === 'stripe_form' && stripePromise && stripeOptions && (
                        <div className="space-y-4">
                            <div className="bg-[#c4d82e]/10 border border-[#c4d82e]/20 rounded-2xl p-4 flex items-center justify-between mb-4">
                                <p className="text-white font-semibold">{packageItem.credits_amount} créditos</p>
                                <p className="text-xl font-black text-white">R$ {packageItem.price.toFixed(2)}</p>
                            </div>
                            <Elements stripe={stripePromise} options={stripeOptions}>
                                <StripeCardForm
                                    packageId={packageItem.id}
                                    userId={user?.id ?? ''}
                                    onSuccess={handleStripeSuccess}
                                    onError={(msg) => { setError(msg); setStep('method'); }}
                                />
                            </Elements>
                        </div>
                    )}

                    {/* === STEP: success === */}
                    {step === 'success' && (
                        <div className="flex flex-col items-center py-12 gap-4 text-center">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Pagamento confirmado!</h3>
                            <p className="text-gray-400">{packageItem.credits_amount} créditos adicionados à sua conta.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DialerCreditCheckoutModal;
