import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, CharacterCard } from './';
import { Character, Battle, BattleRound, ChatMessage as ChatMessageType } from '../types';
import { geminiService } from '../services/geminiService';
import { dataService } from '../services/dataService';
import { useWebSocket } from '../hooks/useWebSocket';
import { Swords, Play, Pause, RotateCcw, Trophy } from 'lucide-react';

interface BattleArenaProps {
  character1: Character | null;
  character2: Character | null;
  onBattleEnd?: (battle: Battle) => void;
  currentPlayer?: number;
  gameState?: any;
  onStartBattle?: () => void;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  character1,
  character2,
  onBattleEnd,
  currentPlayer = 1,
  gameState,
  onStartBattle
}) => {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, onNewRhyme } = useWebSocket();

  // Escutar novas rimas via WebSocket
  useEffect(() => {
    onNewRhyme((data) => {
      const rhymeMessage: ChatMessageType = {
        id: `rhyme-${Date.now()}`,
        type: 'ai',
        content: data.verses.join('\n'),
        timestamp: new Date(),
        characterName: data.character.name
      };

      setMessages(prev => [...prev, rhymeMessage]);

      if (data.isFinished) {
        const endMessage: ChatMessageType = {
          id: 'battle-end',
          type: 'system',
          content: '🏆 BATALHA FINALIZADA! 🏆',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, endMessage]);
        setIsActive(false);
      }
    });
  }, [onNewRhyme]);

  useEffect(() => {
    // Verificar se existe uma batalha em andamento
    const existingBattle = dataService.getCurrentBattle();
    if (existingBattle && character1 && character2) {
      setBattle(existingBattle);
      setCurrentRound(Math.floor(existingBattle.rounds.length / 2) + 1);
      loadBattleMessages(existingBattle);
      setIsActive(existingBattle.status === 'active');
    }
  }, [character1, character2]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadBattleMessages = (battleData: Battle) => {
    const battleMessages: ChatMessageType[] = [
      {
        id: 'battle-start',
        type: 'system',
        content: `🔥 BATALHA INICIADA: ${battleData.character1.name} VS ${battleData.character2.name} 🔥`,
        timestamp: battleData.createdAt
      }
    ];

    battleData.rounds.forEach((round) => {
      battleMessages.push({
        id: round.id,
        type: 'ai',
        content: round.verses.join('\n'),
        timestamp: round.timestamp,
        characterName: round.characterName
      });
    });

    if (battleData.status === 'finished') {
      battleMessages.push({
        id: 'battle-end',
        type: 'system',
        content: '🏆 BATALHA FINALIZADA! 🏆',
        timestamp: new Date()
      });
    }

    setMessages(battleMessages);
  };

  const startBattle = async () => {
    if (!character1 || !character2) return;

    // Usar WebSocket para iniciar batalha
    if (onStartBattle) {
      onStartBattle();
    }

    setIsActive(true);

    const startMessage: ChatMessageType = {
      id: 'battle-start',
      type: 'system',
      content: `🔥 BATALHA INICIADA: ${character1.name} VS ${character2.name} 🔥`,
      timestamp: new Date()
    };

    setMessages([startMessage]);
  };

  const generateNextRhyme = async (currentBattle: Battle, character: Character, lastRhyme?: string) => {
    setIsLoading(true);

    try {
      const roundNum = Math.floor(currentBattle.rounds.length / 2) + 1;
      const verses = await geminiService.generateBattleRhyme(character, lastRhyme, roundNum);

      const newRound: BattleRound = {
        id: `round-${currentBattle.id}-${Date.now()}`,
        characterId: character.id,
        characterName: character.name,
        verses,
        timestamp: new Date(),
        roundNumber: roundNum
      };

      const updatedBattle = dataService.addRoundToBattle(currentBattle.id, newRound);
      
      if (updatedBattle) {
        setBattle(updatedBattle);
        
        const rhymeMessage: ChatMessageType = {
          id: newRound.id,
          type: 'ai',
          content: verses.join('\n'),
          timestamp: newRound.timestamp,
          characterName: character.name
        };

        setMessages(prev => [...prev, rhymeMessage]);

        // Enviar via WebSocket
        sendMessage({
          type: 'rhyme_generated',
          payload: { battleId: currentBattle.id, round: newRound }
        });

        // Verificar se a batalha terminou
        if (updatedBattle.status === 'finished') {
          const endMessage: ChatMessageType = {
            id: 'battle-end',
            type: 'system',
            content: '🏆 BATALHA FINALIZADA! 🏆',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, endMessage]);
          setIsActive(false);
          onBattleEnd?.(updatedBattle);
        } else {
          // Continuar com o próximo personagem
          const nextCharacter = character.id === updatedBattle.character1.id 
            ? updatedBattle.character2 
            : updatedBattle.character1;
          
          setTimeout(() => {
            generateNextRhyme(updatedBattle, nextCharacter, verses.join('\n'));
          }, 3000); // Delay entre as rimas
        }
      }
    } catch (error) {
      console.error('Erro ao gerar rima:', error);
      const errorMessage: ChatMessageType = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: 'Erro ao gerar rima. Tente novamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const pauseBattle = () => {
    setIsActive(false);
  };

  const resumeBattle = () => {
    if (battle && battle.status === 'active') {
      setIsActive(true);
      // Continuar da onde parou
      const lastRound = battle.rounds[battle.rounds.length - 1];
      const nextCharacter = lastRound?.characterId === battle.character1.id 
        ? battle.character2 
        : battle.character1;
      
      generateNextRhyme(battle, nextCharacter, lastRound?.verses.join('\n'));
    }
  };

  const resetBattle = () => {
    dataService.setCurrentBattle(null);
    setBattle(null);
    setMessages([]);
    setIsActive(false);
    setCurrentRound(1);
  };

  const canStartBattle = character1 && character2 && !battle;
  const currentTurnCharacter = battle ? 
    (battle.currentTurn === 1 ? battle.character1 : battle.character2) : null;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-black to-gray-900">
      {/* Header */}
      <div className="bg-gray-900/80 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Swords className="text-cyan-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">Arena de Batalha</h2>
              <p className="text-gray-400 text-sm">
                {battle ? `Round ${currentRound}/6` : 'Configure os personagens para começar'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {canStartBattle && (
              <button
                onClick={startBattle}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg shadow-cyan-500/25"
              >
                <Play size={16} />
                <span>Iniciar Batalha</span>
              </button>
            )}
            
            {battle && isActive && (
              <button
                onClick={pauseBattle}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg shadow-yellow-500/25"
              >
                <Pause size={16} />
                <span>Pausar</span>
              </button>
            )}
            
            {battle && !isActive && battle.status === 'active' && (
              <button
                onClick={resumeBattle}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg shadow-blue-500/25"
              >
                <Play size={16} />
                <span>Continuar</span>
              </button>
            )}
            
            {battle && (
              <button
                onClick={resetBattle}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Characters Display */}
      <div className="bg-gray-900/50 p-4 border-b border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentPlayer === 1 ? (
            <>
              <CharacterCard 
                character={character1} 
                userId={1} 
                isActive={currentTurnCharacter?.id === character1?.id && isActive}
                title="Minha IA"
              />
              <CharacterCard 
                character={character2} 
                userId={2}
                isActive={currentTurnCharacter?.id === character2?.id && isActive}
                title="IA Adversária"
              />
            </>
          ) : (
            <>
              <CharacterCard 
                character={character1} 
                userId={1}
                isActive={currentTurnCharacter?.id === character1?.id && isActive}
                title="IA Adversária"
              />
              <CharacterCard 
                character={character2} 
                userId={2} 
                isActive={currentTurnCharacter?.id === character2?.id && isActive}
                title="Minha IA"
              />
            </>
          )}
        </div>
      </div>

      {/* Battle Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {!character1 || !character2 ? (
          <div className="text-center text-gray-400 py-12">
            <Trophy size={64} className="mx-auto mb-4 opacity-50 text-cyan-400" />
            <h3 className="text-xl font-semibold mb-2">Arena Vazia</h3>
            <p>Aguardando o outro jogador configurar seu personagem...</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="text-center py-4">
                <div className="inline-flex items-center space-x-2 bg-cyan-600/20 text-cyan-400 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span>{currentTurnCharacter?.name} está rimando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
};