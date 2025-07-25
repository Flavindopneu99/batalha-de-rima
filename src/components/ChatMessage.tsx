import React from 'react';
import { Bot, User, Info } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
  isTyping?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isTyping = false }) => {
  const getMessageIcon = () => {
    switch (message.type) {
      case 'user':
        return <User className="w-5 h-5 text-cyan-400" />;
      case 'ai':
        return <Bot className="w-5 h-5 text-[#028ebf]" />;
      case 'system':
        return <Info className="w-5 h-5 text-gray-400" />;
      default:
        return <Bot className="w-5 h-5 text-[#028ebf]" />;
    }
  };

  const getMessageStyles = () => {
    switch (message.type) {
      case 'user':
        return 'bg-gradient-to-r from-cyan-600 to-[#028ebf] text-white ml-auto';
      case 'ai':
        return 'bg-gray-800 border border-[#028ebf]/30 text-gray-100';
      case 'system':
        return 'bg-gray-900 border border-gray-700 text-gray-300 text-center';
      default:
        return 'bg-gray-800 border border-[#028ebf]/30 text-gray-100';
    }
  };

  const formatContent = (content: string) => {
    // Split content by line breaks and render each line
    return content.split('\n').map((line, index) => (
      <div key={index} className={index > 0 ? 'mt-2' : ''}>
        {line}
      </div>
    ));
  };

  return (
    <div className={`flex items-start gap-3 mb-4 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center border border-[#028ebf]/30">
        {getMessageIcon()}
      </div>
      
      <div className={`max-w-[80%] rounded-lg px-4 py-3 shadow-lg ${getMessageStyles()}`}>
        {message.type !== 'system' && (
          <div className="text-xs opacity-70 mb-1">
            {message.type === 'user' ? 'Você' : message.sender || 'IA'}
          </div>
        )}
        
        <div className="text-sm leading-relaxed">
          {isTyping ? (
            <div className="flex items-center gap-1">
              <span>Digitando</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-[#028ebf] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-[#028ebf] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 bg-[#028ebf] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : (
            formatContent(message.content)
          )}
        </div>
        
        <div className="text-xs opacity-50 mt-2">
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
};