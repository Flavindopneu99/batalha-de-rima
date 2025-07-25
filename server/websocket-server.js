import { WebSocketServer as WSServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

class GameRoom {
  constructor(id) {
    this.id = id;
    this.players = new Map();
    this.gameState = {
      status: 'waiting',
      currentTurn: null,
      battle: null,
      rounds: []
    };
    this.createdAt = new Date();
  }

  addPlayer(ws, playerId) {
    if (this.players.size >= 2) {
      return { success: false, error: 'Sala lotada. Máximo 2 jogadores.' };
    }

    const playerNumber = this.players.size === 0 ? 1 : 2;
    this.players.set(playerId, {
      ws,
      playerNumber,
      character: null,
      isReady: false
    });

    return { success: true, playerNumber };
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    return this.players.size === 0;
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  getPlayerByNumber(playerNumber) {
    return Array.from(this.players.values()).find(p => p.playerNumber === playerNumber) || null;
  }

  broadcast(message, excludePlayerId = null) {
    this.players.forEach((player, playerId) => {
      if (playerId !== excludePlayerId && player.ws.readyState === player.ws.OPEN) {
        player.ws.send(JSON.stringify(message));
      }
    });
  }

  sendToPlayer(playerId, message) {
    const player = this.players.get(playerId);
    if (player && player.ws.readyState === player.ws.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  }

  updateGameState(newState) {
    this.gameState = { ...this.gameState, ...newState };
    this.broadcast({
      type: 'game_state_update',
      payload: this.gameState
    });
  }

  areAllPlayersReady() {
    return this.players.size === 2 &&
      Array.from(this.players.values()).every(p => p.isReady && p.character);
  }
}

class WebSocketGameServer {
  constructor(port = 3001) {
    this.port = port;
    this.rooms = new Map();
    this.playerRooms = new Map();
    this.wss = null;
  }

  start() {
    this.wss = new WSServer({ port: this.port });

    this.wss.on('connection', (ws) => {
      const playerId = uuidv4();
      console.log(`Novo jogador conectado: ${playerId}`);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(ws, playerId, message);
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
          ws.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Mensagem inválida' }
          }));
        }
      });

      ws.on('close', () => this.handleDisconnect(playerId));

      ws.send(JSON.stringify({
        type: 'player_id',
        payload: { playerId }
      }));
    });

    console.log(`Servidor WebSocket rodando na porta ${this.port}`);
  }

  handleMessage(ws, playerId, message) {
    const { type, payload } = message;

    switch (type) {
      case 'join_room':
        this.handleJoinRoom(ws, playerId, payload.roomId);
        break;
      case 'character_configured':
        this.handleCharacterConfigured(playerId, payload);
        break;
      case 'start_battle':
        this.handleStartBattle(playerId);
        break;
      case 'battle_rhyme':
        this.handleBattleRhyme(playerId, payload);
        break;
      case 'chat_message':
        this.handleChatMessage(playerId, payload);
        break;
      default:
        console.log(`Tipo de mensagem desconhecido: ${type}`);
    }
  }

  handleJoinRoom(ws, playerId, roomId) {
    const oldRoomId = this.playerRooms.get(playerId);
    if (oldRoomId) this.leaveRoom(playerId, oldRoomId);

    if (!this.rooms.has(roomId)) this.rooms.set(roomId, new GameRoom(roomId));
    const room = this.rooms.get(roomId);
    const result = room.addPlayer(ws, playerId);

    if (result.success) {
      this.playerRooms.set(playerId, roomId);

      ws.send(JSON.stringify({
        type: 'room_joined',
        payload: {
          roomId,
          playerNumber: result.playerNumber,
          playersCount: room.players.size,
          gameState: room.gameState
        }
      }));

      room.broadcast({
        type: 'player_joined',
        payload: {
          playerNumber: result.playerNumber,
          playersCount: room.players.size
        }
      }, playerId);

      console.log(`Jogador ${playerId} entrou na sala ${roomId} como Jogador ${result.playerNumber}`);
    } else {
      ws.send(JSON.stringify({
        type: 'join_room_error',
        payload: { message: result.error }
      }));
    }
  }

  handleCharacterConfigured(playerId, payload) {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    const player = room.getPlayer(playerId);

    if (player) {
      player.character = payload.character;
      player.isReady = true;

      room.broadcast({
        type: 'player_character_configured',
        payload: {
          playerNumber: player.playerNumber,
          character: payload.character
        }
      }, playerId);

      if (room.areAllPlayersReady()) {
        room.updateGameState({ status: 'ready_to_battle' });
      }
    }
  }

  handleStartBattle(playerId) {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (room.areAllPlayersReady() && room.gameState.status === 'ready_to_battle') {
      const player1 = room.getPlayerByNumber(1);
      const player2 = room.getPlayerByNumber(2);

      room.updateGameState({
        status: 'battling',
        currentTurn: 1,
        battle: {
          character1: player1.character,
          character2: player2.character,
          rounds: [],
          maxRounds: 6
        }
      });

      console.log(`Batalha iniciada na sala ${roomId}`);
    }
  }

  handleBattleRhyme(playerId, payload) {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    const player = room.getPlayer(playerId);

    if (room.gameState.status === 'battling' &&
        room.gameState.currentTurn === player.playerNumber) {
      
      room.gameState.rounds.push({
        playerNumber: player.playerNumber,
        character: player.character,
        verses: payload.verses,
        timestamp: new Date()
      });

      const nextTurn = room.gameState.currentTurn === 1 ? 2 : 1;
      const isFinished = room.gameState.rounds.length >= room.gameState.battle.maxRounds * 2;

      room.updateGameState({
        currentTurn: isFinished ? null : nextTurn,
        status: isFinished ? 'finished' : 'battling',
        rounds: room.gameState.rounds
      });

      room.broadcast({
        type: 'new_rhyme',
        payload: {
          playerNumber: player.playerNumber,
          character: player.character,
          verses: payload.verses,
          isFinished
        }
      });
    }
  }

  handleChatMessage(playerId, payload) {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    const player = room.getPlayer(playerId);

    room.broadcast({
      type: 'chat_message',
      payload: {
        playerNumber: player.playerNumber,
        message: payload.message,
        timestamp: new Date()
      }
    }, playerId);
  }

  handleDisconnect(playerId) {
    const roomId = this.playerRooms.get(playerId);
    if (roomId) this.leaveRoom(playerId, roomId);
    console.log(`Jogador ${playerId} desconectado`);
  }

  leaveRoom(playerId, roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.getPlayer(playerId);
    const isEmpty = room.removePlayer(playerId);

    if (player) {
      room.broadcast({
        type: 'player_left',
        payload: {
          playerNumber: player.playerNumber,
          playersCount: room.players.size
        }
      });
    }

    if (isEmpty) {
      this.rooms.delete(roomId);
      console.log(`Sala ${roomId} removida (vazia)`);
    }

    this.playerRooms.delete(playerId);
  }

  cleanupOldRooms() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000;

    this.rooms.forEach((room, roomId) => {
      if (now - room.createdAt > maxAge && room.players.size === 0) {
        this.rooms.delete(roomId);
        console.log(`Sala antiga ${roomId} removida`);
      }
    });
  }
}

const server = new WebSocketGameServer(3001);
server.start();

setInterval(() => {
  server.cleanupOldRooms();
}, 60 * 60 * 1000);
