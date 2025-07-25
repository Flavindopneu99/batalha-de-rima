import { useState, useEffect, useCallback, useRef } from 'react';
import { Character, Battle } from '../types';

interface WebSocketMessage {
  type: string;
  payload: any;
}

interface GameState {
  status: 'waiting' | 'configuring' | 'ready_to_battle' | 'battling' | 'finished';
  currentTurn: number | null;
  battle: Battle | null;
  rounds: any[];
}

interface UseWebSocketReturn {
  isConnected: boolean;
  playerId: string | null;
  playerNumber: number | null;
  roomId: string | null;
  playersCount: number;
  gameState: GameState;
  joinRoom: (roomId: string) => void;
  sendCharacterConfigured: (character: Character) => void;
  startBattle: () => void;
  sendBattleRhyme: (verses: string[]) => void;
  sendChatMessage: (message: string) => void;
  onPlayerJoined: (callback: (data: any) => void) => void;
  onPlayerLeft: (callback: (data: any) => void) => void;
  onCharacterConfigured: (callback: (data: any) => void) => void;
  onNewRhyme: (callback: (data: any) => void) => void;
  onGameStateUpdate: (callback: (gameState: GameState) => void) => void;
}

export const useWebSocket = (wsUrl?: string): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerNumber, setPlayerNumber] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playersCount, setPlayersCount] = useState(0);
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    currentTurn: null,
    battle: null,
    rounds: []
  });

  const ws = useRef<WebSocket | null>(null);
  const callbacks = useRef<{[key: string]: Function[]}>({});

  // URL do WebSocket (desenvolvimento local)
  const socketUrl = wsUrl || 'ws://localhost:3001';

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      ws.current = new WebSocket(socketUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket conectado');
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket desconectado');
        
        // Tentar reconectar após 3 segundos
        setTimeout(() => {
          if (!isConnected) {
            connectWebSocket();
          }
        }, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('Erro WebSocket:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
      setIsConnected(false);
      
      // Fallback: simular conexão para desenvolvimento
      setTimeout(() => {
        setIsConnected(true);
        setPlayerId(`player-${Date.now()}`);
      }, 1000);
    }
  };

  const handleMessage = (message: WebSocketMessage) => {
    const { type, payload } = message;

    switch (type) {
      case 'player_id':
        setPlayerId(payload.playerId);
        break;

      case 'room_joined':
        setRoomId(payload.roomId);
        setPlayerNumber(payload.playerNumber);
        setPlayersCount(payload.playersCount);
        setGameState(payload.gameState);
        break;

      case 'join_room_error':
        alert(payload.message);
        break;

      case 'player_joined':
        setPlayersCount(payload.playersCount);
        triggerCallback('playerJoined', payload);
        break;

      case 'player_left':
        setPlayersCount(payload.playersCount);
        triggerCallback('playerLeft', payload);
        break;

      case 'player_character_configured':
        triggerCallback('characterConfigured', payload);
        break;

      case 'game_state_update':
        setGameState(payload);
        triggerCallback('gameStateUpdate', payload);
        break;

      case 'new_rhyme':
        triggerCallback('newRhyme', payload);
        break;

      case 'chat_message':
        triggerCallback('chatMessage', payload);
        break;

      default:
        console.log('Tipo de mensagem desconhecido:', type);
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket não conectado');
    }
  };

  const triggerCallback = (eventType: string, data: any) => {
    if (callbacks.current[eventType]) {
      callbacks.current[eventType].forEach(callback => callback(data));
    }
  };

  const addCallback = (eventType: string, callback: Function) => {
    if (!callbacks.current[eventType]) {
      callbacks.current[eventType] = [];
    }
    callbacks.current[eventType].push(callback);
  };

  // Métodos públicos
  const joinRoom = useCallback((roomId: string) => {
    sendMessage({
      type: 'join_room',
      payload: { roomId }
    });
  }, []);

  const sendCharacterConfigured = useCallback((character: Character) => {
    sendMessage({
      type: 'character_configured',
      payload: { character }
    });
  }, []);

  const startBattle = useCallback(() => {
    sendMessage({
      type: 'start_battle',
      payload: {}
    });
  }, []);

  const sendBattleRhyme = useCallback((verses: string[]) => {
    sendMessage({
      type: 'battle_rhyme',
      payload: { verses }
    });
  }, []);

  const sendChatMessage = useCallback((message: string) => {
    sendMessage({
      type: 'chat_message',
      payload: { message }
    });
  }, []);

  // Event listeners
  const onPlayerJoined = useCallback((callback: (data: any) => void) => {
    addCallback('playerJoined', callback);
  }, []);

  const onPlayerLeft = useCallback((callback: (data: any) => void) => {
    addCallback('playerLeft', callback);
  }, []);

  const onCharacterConfigured = useCallback((callback: (data: any) => void) => {
    addCallback('characterConfigured', callback);
  }, []);

  const onNewRhyme = useCallback((callback: (data: any) => void) => {
    addCallback('newRhyme', callback);
  }, []);

  const onGameStateUpdate = useCallback((callback: (gameState: GameState) => void) => {
    addCallback('gameStateUpdate', callback);
  }, []);

  return {
    isConnected,
    playerId,
    playerNumber,
    roomId,
    playersCount,
    gameState,
    joinRoom,
    sendCharacterConfigured,
    startBattle,
    sendBattleRhyme,
    sendChatMessage,
    onPlayerJoined,
    onPlayerLeft,
    onCharacterConfigured,
    onNewRhyme,
    onGameStateUpdate
  };
};