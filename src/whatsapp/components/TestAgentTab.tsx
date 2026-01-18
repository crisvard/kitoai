import React, { useState } from 'react';
import { MessageSquare, Send, User, Bot } from 'lucide-react';
import { AppConfig } from '../types';
import { generateAIResponse } from '../utils/wahaApi';

interface TestAgentTabProps {
  config: AppConfig;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

export const TestAgentTab: React.FC<TestAgentTabProps> = ({ config }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Olá! Sou seu agente de teste. Como posso ajudá-lo hoje?',
      sender: 'agent',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await generateAIResponse(inputMessage, config.agent.prompt);

      setTimeout(() => {
        const agentMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: response,
          sender: 'agent',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, agentMessage]);
        setIsTyping(false);
      }, 1000 + Math.random() * 2000);
    } catch (error) {
      console.error('Error generating response:', error);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6">
      {/* Chat Header */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#c4d82e]/20 to-[#c4d82e]/10 rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-[#c4d82e]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Agente de Teste</h3>
            <p className="text-gray-400 text-sm">Teste seu agente de IA em um chat simulado</p>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.sender === 'agent' && (
                <div className="w-8 h-8 bg-[#c4d82e] rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-black" />
                </div>
              )}

              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-[#c4d82e] text-black'
                    : 'bg-white/10 text-white border border-white/20'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-black/70' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {message.sender === 'user' && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-8 h-8 bg-[#c4d82e] rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-black" />
              </div>
              <div className="bg-white/10 text-white border border-white/20 px-4 py-2 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="border-t border-white/10 p-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-3 bg-[#2a2a2a] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#c4d82e] focus:outline-none transition-colors"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="px-6 py-3 bg-[#c4d82e] hover:bg-[#b5c928] disabled:bg-gray-600 disabled:text-gray-400 text-black font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#c4d82e]/30 hover:scale-105 active:scale-95 disabled:hover:scale-100 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-300 mb-1">
              Como testar seu agente
            </p>
            <p className="text-xs text-blue-200">
              Digite mensagens como se fosse um cliente real. O agente responderá baseado no prompt configurado.
              Teste diferentes cenários para verificar se o comportamento está adequado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};