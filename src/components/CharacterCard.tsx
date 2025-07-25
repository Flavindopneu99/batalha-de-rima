import React from 'react';
import { Character } from '../types';
import { Mic, Zap, Target, User, Edit3 } from 'lucide-react';

interface CharacterCardProps {
  character: Character | null;
  userId: number;
  onEdit?: () => void;
  isActive?: boolean;
  title?: string;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  userId, 
  onEdit, 
  isActive = false,
  title
}) => {
  if (!character) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 border-2 border-dashed border-gray-700 text-center">
        <div className="text-gray-400 mb-4">
          <User size={48} className="mx-auto mb-3" />
          <h3 className="text-lg font-semibold">{title || `Jogador ${userId}`}</h3>
          <p className="text-sm">Personagem não configurado</p>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-cyan-500/25"
          >
            Configurar Personagem
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 border-2 transition-all duration-300 ${
      isActive ? 'border-cyan-400 shadow-lg shadow-cyan-400/20' : 'border-gray-800'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${
            userId === 1 ? 'from-cyan-400 to-blue-500' : 'from-blue-500 to-cyan-400'
          } flex items-center justify-center shadow-lg ${
            userId === 1 ? 'shadow-cyan-500/25' : 'shadow-blue-500/25'
          }`}>
            <Mic className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{character.name}</h3>
            <p className="text-gray-400 text-sm">{title || `Jogador ${userId}`}</p>
          </div>
        </div>
        
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <Edit3 size={20} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Zap className="text-cyan-400" size={16} />
          <span className="text-gray-300 text-sm">
            <strong>Estilo:</strong> {character.style}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Target className="text-blue-400" size={16} />
          <span className="text-gray-300 text-sm">
            <strong>Rival:</strong> {character.rivalName}
          </span>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-3 mt-4 border border-gray-700">
          <h4 className="text-cyan-400 font-semibold text-sm mb-2">Motivo da Rivalidade:</h4>
          <p className="text-gray-300 text-xs leading-relaxed">{character.rivalryReason}</p>
        </div>
      </div>

      {isActive && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2 bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span>Sua vez de rimar!</span>
          </div>
        </div>
      )}
    </div>
  );
};