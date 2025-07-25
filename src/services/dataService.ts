import { Character, Battle, BattleRound } from '../types';

export class DataService {
  private readonly STORAGE_KEYS = {
    CHARACTERS: 'battle-characters',
    BATTLES: 'battle-history',
    CURRENT_BATTLE: 'current-battle'
  };

  // Gerenciamento de Personagens
  saveCharacter(character: Character): void {
    const characters = this.getCharacters();
    const existingIndex = characters.findIndex(c => c.id === character.id);
    
    if (existingIndex >= 0) {
      characters[existingIndex] = character;
    } else {
      characters.push(character);
    }
    
    localStorage.setItem(this.STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
  }

  getCharacters(): Character[] {
    const stored = localStorage.getItem(this.STORAGE_KEYS.CHARACTERS);
    return stored ? JSON.parse(stored) : [];
  }

  getCharacterByUserId(userId: number): Character | null {
    const characters = this.getCharacters();
    return characters.find(c => c.userId === userId) || null;
  }

  deleteCharacter(characterId: string): void {
    const characters = this.getCharacters().filter(c => c.id !== characterId);
    localStorage.setItem(this.STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
  }

  // Gerenciamento de Batalhas
  saveBattle(battle: Battle): void {
    const battles = this.getBattles();
    const existingIndex = battles.findIndex(b => b.id === battle.id);
    
    if (existingIndex >= 0) {
      battles[existingIndex] = battle;
    } else {
      battles.push(battle);
    }
    
    localStorage.setItem(this.STORAGE_KEYS.BATTLES, JSON.stringify(battles));
  }

  getBattles(): Battle[] {
    const stored = localStorage.getItem(this.STORAGE_KEYS.BATTLES);
    return stored ? JSON.parse(stored) : [];
  }

  getCurrentBattle(): Battle | null {
    const stored = localStorage.getItem(this.STORAGE_KEYS.CURRENT_BATTLE);
    return stored ? JSON.parse(stored) : null;
  }

  setCurrentBattle(battle: Battle | null): void {
    if (battle) {
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_BATTLE, JSON.stringify(battle));
    } else {
      localStorage.removeItem(this.STORAGE_KEYS.CURRENT_BATTLE);
    }
  }

  createBattle(character1: Character, character2: Character): Battle {
    const battle: Battle = {
      id: `battle-${Date.now()}`,
      character1,
      character2,
      rounds: [],
      currentTurn: 1,
      maxRounds: 6,
      status: 'active',
      createdAt: new Date()
    };

    this.setCurrentBattle(battle);
    return battle;
  }

  addRoundToBattle(battleId: string, round: BattleRound): Battle | null {
    const currentBattle = this.getCurrentBattle();
    if (!currentBattle || currentBattle.id !== battleId) return null;

    currentBattle.rounds.push(round);
    currentBattle.currentTurn = currentBattle.currentTurn === 1 ? 2 : 1;

    // Verificar se a batalha terminou
    if (currentBattle.rounds.length >= currentBattle.maxRounds * 2) {
      currentBattle.status = 'finished';
      this.saveBattle(currentBattle);
    }

    this.setCurrentBattle(currentBattle);
    return currentBattle;
  }

  // Utilitários
  clearAllData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  exportData(): string {
    const data = {
      characters: this.getCharacters(),
      battles: this.getBattles(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.characters) {
        localStorage.setItem(this.STORAGE_KEYS.CHARACTERS, JSON.stringify(data.characters));
      }
      
      if (data.battles) {
        localStorage.setItem(this.STORAGE_KEYS.BATTLES, JSON.stringify(data.battles));
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return false;
    }
  }
}

export const dataService = new DataService();