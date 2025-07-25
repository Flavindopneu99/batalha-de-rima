import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatInput } from './';
import { Character, ChatMessage as ChatMessageType, ConfigurationStep } from '../types';
import { geminiService } from '../services/geminiService';
import { dataService } from '../services/dataService';
import { Settings, CheckCircle } from 'lucide-react';

interface ConfigurationChatProps {
  userId: number;
  onCharacterComplete: (character: Character) => void;
}

const CONFIGURATION_STEPS: ConfigurationStep[] = [
  {
    question: "Qual é o nome do seu personagem MC?",
    field: "name",
    placeholder: "Ex: MC Thunder, DJ Flash, etc."
  },
  {
    question: "Qual é o estilo de rima do seu personagem?",
    field: "style", 
    placeholder: "Ex: agressivo, filosófico, sarcástico, engraçado, intelectual"
  },
  {
    question: "Qual é o nome do seu rival nesta batalha?",
    field: "rivalName",
    placeholder: "Ex: MC Shadow, DJ Storm, etc."
  },
  {
    question: "Conte a história do seu rival. De onde ele vem?",
    field: "rivalHistory",
    placeholder: "Ex: Veio das ruas de Copacabana, sempre foi arrogante..."
  },
  {
    question: "Por que vocês são rivais? Qual o motivo da rivalidade?",
    field: "rivalryReason",
    placeholder: "Ex: Ele me desrespeitou numa batalha passada..."
  }
];

export const ConfigurationChat: React.FC<ConfigurationChatProps> = ({
  userId,
  onCharacterComplete
}) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [character, setCharacter] = useState<Partial<Character>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Verificar se já existe um personagem salvo
    const savedCharacter = dataService.getCharacterByUserId(userId);
    if (savedCharacter) {
      setCharacter(savedCharacter);
      setIsComplete(true);
      setMessages([
        {
          id: 'welcome-saved',
          type: 'system',
          content: `Personagem ${savedCharacter.name} já está configurado! Você pode editá-lo ou iniciar uma batalha.`,
          timestamp: new Date()
        }
      ]);
    } else {
      // Iniciar configuração
      setMessages([
        {
          id: 'welcome',
          type: 'system',
          content: `Bem-vindo, Jogador ${userId}! Vamos configurar seu personagem MC para a batalha de rimas.`,
          timestamp: new Date()
        },
        {
          id: 'first-question',
          type: 'ai',
          content: CONFIGURATION_STEPS[0].question,
          timestamp: new Date()
        }
      ]);
    }
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageContent: string) => {
    if (isComplete) return;

    // Adicionar mensagem do usuário
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Atualizar o campo do personagem
      const currentField = CONFIGURATION_STEPS[currentStep].field;
      const updatedCharacter = {
        ...character,
        [currentField]: messageContent
      };
      setCharacter(updatedCharacter);

      // Gerar resposta da IA
      const aiResponse = await geminiService.generateConfigurationResponse(
        updatedCharacter,
        messageContent,
        CONFIGURATION_STEPS[currentStep].question
      );

      const aiMessage: ChatMessageType = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Próximo passo ou finalizar
      if (currentStep < CONFIGURATION_STEPS.length - 1) {
        setTimeout(() => {
          const nextQuestion: ChatMessageType = {
            id: `question-${currentStep + 1}`,
            type: 'ai',
            content: CONFIGURATION_STEPS[currentStep + 1].question,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, nextQuestion]);
          setCurrentStep(currentStep + 1);
        }, 1500);
      } else {
        // Configuração completa
        const completeCharacter: Character = {
          id: `character-${userId}-${Date.now()}`,
          name: updatedCharacter.name || `MC Player ${userId}`,
          style: updatedCharacter.style || 'freestyle',
          rivalName: updatedCharacter.rivalName || 'Rival Misterioso',
          rivalHistory: updatedCharacter.rivalHistory || 'História desconhecida',
          rivalryReason: updatedCharacter.rivalryReason || 'Rivalidade antiga',
          userId,
          createdAt: new Date()
        };

        dataService.saveCharacter(completeCharacter);
        setCharacter(completeCharacter);
        setIsComplete(true);

        setTimeout(() => {
          const completeMessage: ChatMessageType = {
            id: 'complete',
            type: 'system',
            content: `🎤 Personagem ${completeCharacter.name} configurado com sucesso! Agora você está pronto para a batalha!`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, completeMessage]);
          onCharacterComplete(completeCharacter);
        }, 1000);
      }
    } catch (error) {
      const errorMessage: ChatMessageType = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: 'Erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConfiguration = () => {
    if (character.id) {
      dataService.deleteCharacter(character.id as string);
    }
    setCharacter({});
    setCurrentStep(0);
    setIsComplete(false);
    setMessages([
      {
        id: 'restart',
        type: 'system',
        content: `Reiniciando configuração do Jogador ${userId}...`,
        timestamp: new Date()
      },
      {
        id: 'first-question-restart',
        type: 'ai',
        content: CONFIGURATION_STEPS[0].question,
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-black to-gray-900">
      {/* Header */}
      <div className="bg-gray-900/80 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="text-cyan-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">
                Configuração - Jogador {userId}
              </h2>
              <p className="text-gray-400 text-sm">
                {isComplete ? 'Personagem configurado!' : `Passo ${currentStep + 1} de ${CONFIGURATION_STEPS.length}`}
              </p>
            </div>
          </div>
          
          {isComplete && (
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-cyan-400" size={20} />
              <button
                onClick={resetConfiguration}
                className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
              >
                Reconfigurar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && (
          <ChatMessage
            message={{
              id: 'loading',
              type: 'ai',
              content: 'Pensando...',
              timestamp: new Date()
            }}
            isTyping
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isComplete && (
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          isLoading={isLoading}
          placeholder={CONFIGURATION_STEPS[currentStep]?.placeholder || "Digite sua resposta..."}
        />
      )}
    </div>
  );
};