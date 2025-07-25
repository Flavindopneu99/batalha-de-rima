export interface Character {
  id: string;
  name: string;
  style: string;
  rivalName: string;
  rivalHistory: string;
  rivalryReason: string;
  userId: number;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  characterName?: string;
}

export interface BattleRound {
  id: string;
  characterId: string;
  characterName: string;
  verses: string[];
  timestamp: Date;
  roundNumber: number;
}

export interface Battle {
  id: string;
  character1: Character;
  character2: Character;
  rounds: BattleRound[];
  currentTurn: number;
  maxRounds: number;
  status: 'waiting' | 'active' | 'finished';
  createdAt: Date;
}

export type ChatType = 'config1' | 'config2' | 'battle';

export interface ConfigurationStep {
  question: string;
  field: keyof Omit<Character, 'id' | 'userId' | 'createdAt'>;
  placeholder: string;
}