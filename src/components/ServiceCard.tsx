import { Settings, Play, Square, MessageSquare, Code, PhoneIncoming, CandlestickChart, CircleFadingPlus } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
}

interface ServiceCardProps {
  service: Service;
  onToggle: () => void;
  onConfigure: () => void;
  isContracted?: boolean;
  setupText?: string;
}

function ServiceCard({ service, onToggle, onConfigure, isContracted = false, setupText }: ServiceCardProps) {
  return (
    <div className={`group relative bg-[#2a2a2a] rounded-2xl p-8 border transition-all duration-300 hover:shadow-2xl hover:shadow-[#c4d82e]/10 hover:-translate-y-1 w-full aspect-square flex flex-col ${
      isContracted
        ? 'border-gray-800 hover:border-[#c4d82e]/50'
        : 'border-gray-700/50'
    }`}>
      {/* Lock overlay for non-contracted agents */}
      {!isContracted && (
        <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center z-10">
          <div className="bg-gray-800/90 rounded-full p-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      )}
      {/* Status indicator */}
      {service.isActive && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
      )}

      {/* Icon container */}
      <div className="flex-1 flex items-center justify-center mb-6">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
          service.isActive
            ? 'bg-[#c4d82e]/20 text-[#c4d82e] shadow-lg shadow-[#c4d82e]/20'
            : 'bg-[#3a3a3a] text-gray-400 group-hover:text-[#c4d82e] group-hover:bg-[#c4d82e]/10'
        }`}>
          {/* Modern SVG Icons */}
          {service.id === '1' ? (
            <Code className="w-10 h-10 animate-bounce" />
          ) : service.id === '2' ? (
            <PhoneIncoming className="w-10 h-10 animate-bounce drop-shadow-lg animate-pulse" style={{color: '#25D366'}} />
          ) : service.id === '3' ? (
            // WhatsApp Business Modern Icon with Animations
            <svg className="w-10 h-10 animate-bounce" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="whatsappBusinessCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#25D366" />
                  <stop offset="100%" stopColor="#128C7E" />
                </linearGradient>
              </defs>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" fill="url(#whatsappBusinessCardGrad)"/>
              
              {/* Animated notification dots */}
              <circle cx="20" cy="4" r="1.5" fill="currentColor" className="animate-ping animation-delay-500"/>
              <circle cx="18" cy="6" r="1" fill="white" className="animate-pulse animation-delay-1000"/>
            </svg>
          ) : service.id === '4' ? (
            <CandlestickChart className="w-10 h-10 animate-bounce drop-shadow-lg animate-pulse" style={{color: '#fbbf24'}} />
          ) : service.id === '5' ? (
            <CircleFadingPlus className="w-10 h-10 animate-bounce drop-shadow-lg animate-pulse" style={{color: '#8b5cf6'}} />
          ) : service.id === '6' ? (
            <CandlestickChart className="w-10 h-10 animate-bounce drop-shadow-lg animate-pulse" style={{color: '#fbbf24'}} />
          ) : (
            service.icon
          )}
        </div>
      </div>

      {/* Content */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#c4d82e] transition-colors">
          {service.name}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
          {service.description}
        </p>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <button
          onClick={onConfigure}
          className="w-full flex items-center justify-center space-x-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white py-3 rounded-xl transition-all duration-200 hover:shadow-lg group/btn"
        >
          <Settings className="w-4 h-4 group-hover/btn:rotate-90 transition-transform duration-200" />
          <span className="font-medium">{setupText || 'Configurar'}</span>
        </button>
      </div>

      {/* Active status text */}
      {service.isActive && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center space-x-2 text-green-400 text-sm font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Ativo</span>
          </span>
        </div>
      )}
    </div>
  );
}

export default ServiceCard;
