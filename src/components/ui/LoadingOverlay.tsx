import React from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message: string;
  size?: 'small' | 'large';
  variant?: 'spinner' | 'pulse' | 'bounce';
  subMessage?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message,
  size = 'large',
  variant = 'bounce',
  subMessage = 'Aguarde um momento...'
}) => {
  if (!isVisible) return null;

  const getSpinnerSize = () => {
    switch (size) {
      case 'small': return 'w-12 h-12';
      case 'large': return 'w-24 h-24'; // AUMENTADO PARA 24x24 (96px)
      default: return 'w-20 h-20';
    }
  };

  const getCardSize = () => {
    switch (size) {
      case 'small': return 'max-w-sm';
      case 'large': return 'max-w-lg'; // AUMENTADO PARA max-w-lg
      default: return 'max-w-md';
    }
  };

  const renderSpinner = () => {
    const spinnerClasses = `${getSpinnerSize()} rounded-full`;

    switch (variant) {
      case 'spinner':
        return (
          <div className={`${spinnerClasses} border-4 border-blue-200 border-t-blue-600 animate-spin`} />
        );

      case 'pulse':
        return (
          <div className={`${spinnerClasses} bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse`} />
        );

      case 'bounce':
        return (
          <div className={`${spinnerClasses} bg-blue-500 rounded-full animate-bounce flex items-center justify-center`}>
            <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
          </div>
        );

      default:
        return (
          <div className={`${spinnerClasses} border-4 border-blue-200 border-t-blue-600 animate-spin`} />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background com blur mais escuro */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Card de Loading GRANDE */}
      <div className={`relative bg-white rounded-3xl p-12 shadow-2xl border-4 border-blue-500 ${getCardSize()} w-full mx-4 animate-pulse`}>
        {/* Spinner/Bounce/Pulse MUITO GRANDE */}
        <div className="flex justify-center mb-8">
          {renderSpinner()}
        </div>

        {/* Mensagem Principal GRANDE */}
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-4 animate-bounce">
          {message}
        </h3>

        {/* Sub-mensagem GRANDE */}
        <p className="text-lg text-gray-700 text-center font-medium">
          {subMessage}
        </p>

        {/* Indicador visual extra */}
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};