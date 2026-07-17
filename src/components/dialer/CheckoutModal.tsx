import React from 'react';
import { X, Copy, CheckCircle, Smartphone, Info } from 'lucide-react';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    pixData: {
        qrCodeBase64: string;
        payload: string;
        value: number;
        credits: number;
    } | null;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, pixData }) => {
    const [copied, setCopied] = React.useState(false);

    if (!isOpen || !pixData) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(pixData.payload);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-[#c4d82e]" />
                        Pagamento via PIX
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 flex flex-col items-center text-center">
                    <div className="mb-6 bg-white p-3 rounded-2xl">
                        <img
                            src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                            alt="QR Code PIX"
                            className="w-48 h-48"
                        />
                    </div>

                    <div className="w-full mb-6">
                        <p className="text-sm text-gray-400 mb-2">Valor Total</p>
                        <p className="text-3xl font-bold text-white">R$ {pixData.value.toFixed(2)}</p>
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-[#c4d82e]/10 rounded-full border border-[#c4d82e]/20">
                            <span className="text-xs font-semibold text-[#c4d82e]">{pixData.credits} CRÉDITOS</span>
                        </div>
                    </div>

                    <div className="w-full space-y-4">
                        <button
                            onClick={handleCopy}
                            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all ${copied
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                }`}
                        >
                            {copied ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Copiado!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5 text-gray-400" />
                                    Copiar Código PIX
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-3 text-left">
                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Após o pagamento, os créditos serão adicionados automaticamente à sua conta em instantes. Você receberá uma confirmação na interface.
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-white/[0.02] border-t border-white/5 text-center">
                    <button
                        onClick={onClose}
                        className="text-sm text-gray-500 hover:text-white transition-colors"
                    >
                        Fechar Janela
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;
