import React from 'react';

interface PixQRCodeProps {
  qrCodeBase64: string;
  payload: string;
  onCopyPayload: () => void;
}

const PixQRCode: React.FC<PixQRCodeProps> = ({ qrCodeBase64, payload, onCopyPayload }) => {
  // Verificar se tem dados
  const hasQRCode = !!qrCodeBase64;
  const hasPayload = !!payload;
  const hasAnyData = hasQRCode || hasPayload;

  if (!hasAnyData) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
        <div className="text-center text-red-400">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold mb-2">Erro: Dados PIX Não Disponíveis</h3>
          <p>O Asaas não retornou os dados necessários para gerar o código PIX.</p>
          <p className="text-sm mt-2">Verifique a configuração PIX no Asaas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
      <h3 className="text-xl font-bold text-white mb-6">
        Pagamento PIX
      </h3>
      <p className="text-gray-400 mb-6">
        Escaneie o QR Code ou copie o código para pagar
      </p>

      {/* QR Code Display */}
      {hasQRCode && (
        <div className="flex justify-center mb-6">
          <div className="text-center">
            <img
              src={`data:image/png;base64,${qrCodeBase64}`}
              alt="QR Code PIX"
              className="w-64 h-64 border border-white/20 rounded-lg mx-auto shadow-lg"
            />
            <p className="text-gray-400 text-sm mt-3">
              Escaneie com a câmera do seu celular
            </p>
          </div>
        </div>
      )}

      {/* Payload Display */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Código PIX (Copia e Cola)
          </label>
          {hasPayload ? (
            <div className="flex">
              <input
                type="text"
                value={payload}
                readOnly
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c4d82e]/50"
              />
              <button
                onClick={onCopyPayload}
                className="ml-3 px-6 py-3 bg-[#c4d82e] hover:bg-[#b5c928] text-black font-medium rounded-xl transition-colors hover:shadow-lg"
              >
                Copiar
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-400/20 rounded-xl">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-400 rounded-full mr-3 animate-pulse"></div>
                <span className="text-red-400 font-medium">
                  Código PIX não disponível
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PixQRCode;