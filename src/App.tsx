import React, { useState, useEffect, useCallback } from 'react';
import { ConfigurationChat, BattleArena } from './components';
import { Character, Battle, ChatType } from './types';
import { dataService } from './services/dataService';
import { Mic, Settings, Swords, Users, Wifi, WifiOff, User, Link, Copy } from 'lucide-react';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [showRoomInput, setShowRoomInput] = useState(false);
  const [roomInputValue, setRoomInputValue] = useState('');
  const [activeChat, setActiveChat] = useState<ChatType>('config1');
  const [character1, setCharacter1] = useState<Character | null>(null);
  const [character2, setCharacter2] = useState<Character | null>(null);
  const [currentBattle, setCurrentBattle] = useState<Battle | null>(null);
  
  const {
    isConnected,
    playerId,
    playerNumber,
    roomId: connectedRoomId,
    playersCount,
    gameState,
    joinRoom,
    sendCharacterConfigured,
    startBattle,
    onPlayerJoined,
    onPlayerLeft,
    onCharacterConfigured,
    onNewRhyme,
    onGameStateUpdate
  } = useWebSocket();

  useEffect(() => {
    // Extrair roomId da URL se existir
    const urlParams = new URLSearchParams(window.location.search);
    const urlRoomId = urlParams.get('room');
    if (urlRoomId) {
      setRoomId(urlRoomId);
      if (isConnected) {
        joinRoom(urlRoomId);
      }
    }
  }, [isConnected, joinRoom]);

  useEffect(() => {
    if (connectedRoomId) {
      setRoomId(connectedRoomId);
      // Atualizar URL sem recarregar a página
      const newUrl = `${window.location.pathname}?room=${connectedRoomId}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [connectedRoomId]);

  // Event listeners do WebSocket
  useEffect(() => {
    onPlayerJoined((data) => {
      console.log(`Jogador ${data.playerNumber} entrou na sala`);
    });

    onPlayerLeft((data) => {
      console.log(`Jogador ${data.playerNumber} saiu da sala`);
      // Limpar personagem do jogador que saiu
      if (data.playerNumber === 1) {
        setCharacter1(null);
      } else {
        setCharacter2(null);
      }
    });

    onCharacterConfigured((data) => {
      if (data.playerNumber === 1) {
        setCharacter1(data.character);
      } else {
        setCharacter2(data.character);
      }
    });

    onGameStateUpdate((newGameState) => {
      if (newGameState.status === 'ready_to_battle') {
        setActiveChat('battle');
      }
    });
  }, [onPlayerJoined, onPlayerLeft, onCharacterConfigured, onGameStateUpdate]);

  const handleCharacterComplete = (character: Character) => {
    // Salvar localmente
    dataService.saveCharacter(character);
    
    // Atualizar estado local
    if (playerNumber === 1) {
      setCharacter1(character);
    } else {
      setCharacter2(character);
    }

    // Enviar via WebSocket
    sendCharacterConfigured(character);
  };

  const handleBattleEnd = (battle: Battle) => {
    setCurrentBattle(battle);
    dataService.saveBattle(battle);
  };

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    joinRoom(newRoomId);
  };

  const handleJoinRoom = () => {
    if (roomInputValue.trim()) {
      const cleanRoomId = roomInputValue.trim().toUpperCase();
      setRoomId(cleanRoomId);
      joinRoom(cleanRoomId);
      setShowRoomInput(false);
      setRoomInputValue('');
    }
  };

  const copyRoomLink = () => {
    if (roomId) {
      const link = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
      navigator.clipboard.writeText(link);
      alert('Link da sala copiado!');
    }
  };

  // Tela inicial - seleção/criação de sala
  if (!roomId || !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-8 p-8">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/25">
              <Mic className="text-white" size={40} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Batalha de Rima</h1>
            <p className="text-gray-400 text-lg">Duas IAs em combate lírico</p>
            <div className="flex items-center justify-center space-x-2 text-sm">
              {isConnected ? (
                <>
                  <Wifi className="text-cyan-400" size={16} />
                  <span className="text-cyan-400">Conectado</span>
                </>
              ) : (
                <>
                  <WifiOff className="text-red-400" size={16} />
                  <span className="text-red-400">Conectando...</span>
                </>
              )}
            </div>
          </div>

          {isConnected && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Entrar em uma Sala</h2>
              
              <div className="flex flex-col gap-4">
                <button
                  onClick={createRoom}
                  className="group bg-gradient-to-br from-gray-800 to-gray-900 hover:from-cyan-900 hover:to-blue-900 border-2 border-gray-700 hover:border-cyan-500 rounded-xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center group-hover:shadow-lg group-hover:shadow-cyan-500/50 transition-all duration-300">
                      <Swords className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">Criar Nova Sala</h3>
                      <p className="text-gray-400 text-sm">Gere um código único para sua batalha</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setShowRoomInput(!showRoomInput)}
                  className="group bg-gradient-to-br from-gray-800 to-gray-900 hover:from-cyan-900 hover:to-blue-900 border-2 border-gray-700 hover:border-cyan-500 rounded-xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center group-hover:shadow-lg group-hover:shadow-cyan-500/50 transition-all duration-300">
                      <Link className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">Entrar em Sala</h3>
                      <p className="text-gray-400 text-sm">Digite o código de uma sala existente</p>
                    </div>
                  </div>
                </button>
              </div>

              {showRoomInput && (
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={roomInputValue}
                      onChange={(e) => setRoomInputValue(e.target.value.toUpperCase())}
                      placeholder="Digite o código da sala"
                      className="flex-1 bg-gray-900 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-600"
                      maxLength={6}
                    />
                    <button
                      onClick={handleJoinRoom}
                      disabled={!roomInputValue.trim()}
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-cyan-500/25 disabled:shadow-none"
                    >
                      Entrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Aguardando segundo jogador
  if (playersCount < 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-8 p-8">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/25">
              <Users className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Sala: {roomId}</h1>
            <p className="text-gray-400 text-lg">Você é o Jogador {playerNumber}</p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Aguardando segundo jogador...</h3>
              <div className="flex items-center justify-center space-x-2 text-cyan-400">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                <span>Compartilhe o código da sala com seu oponente</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={copyRoomLink}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg shadow-cyan-500/25"
              >
                <Copy size={20} />
                <span>Copiar Link da Sala</span>
              </button>

              <button
                onClick={() => {
                  setRoomId(null);
                  window.history.replaceState({}, '', window.location.pathname);
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors duration-200"
              >
                Sair da Sala
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentCharacter = playerNumber === 1 ? character1 : character2;
  const otherCharacter = playerNumber === 1 ? character2 : character1;

  const getTabStyle = (chatType: ChatType) => {
    const baseStyle = "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200";
    if (activeChat === chatType) {
      return `${baseStyle} bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25`;
    }
    return `${baseStyle} bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-cyan-400`;
  };

  const getTabIcon = (chatType: ChatType) => {
    switch (chatType) {
      case 'config1':
      case 'config2':
        return <Settings size={18} />;
      case 'battle':
        return <Swords size={18} />;
    }
  };

  const getTabTitle = (chatType: ChatType) => {
    if (chatType === 'battle') {
      return 'Arena de Batalha';
    }
    return `Minha Configuração ${currentCharacter ? `(${currentCharacter.name})` : ''}`;
  };

  const getTabBadge = (chatType: ChatType) => {
    if ((chatType === 'config1' || chatType === 'config2') && currentCharacter) {
      return <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-sm shadow-cyan-400/50"></div>;
    }
    if (chatType === 'battle' && currentBattle?.status === 'active') {
      return <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse shadow-sm shadow-red-400/50"></div>;
    }
    return null;
  };

  // Determinar quais abas mostrar baseado no jogador
  const availableTabs: ChatType[] = playerNumber === 1 
    ? ['config1', 'battle'] 
    : ['config2', 'battle'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Mic className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Batalha de Rima</h1>
                <p className="text-gray-400 text-sm">Sala {roomId} - Jogador {playerNumber}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setRoomId(null);
                  window.history.replaceState({}, '', window.location.pathname);
                }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1 rounded text-sm transition-colors duration-200"
              >
                Sair da Sala
              </button>
              
              <div className="flex items-center space-x-2 text-sm">
                {isConnected ? (
                  <>
                    <Wifi className="text-cyan-400" size={16} />
                    <span className="text-cyan-400">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="text-red-400" size={16} />
                    <span className="text-red-400">Offline</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Users size={16} />
                <span>{playersCount}/2 jogadores</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 py-3 overflow-x-auto">
            {availableTabs.map((chatType) => (
              <button
                key={chatType}
                onClick={() => setActiveChat(chatType)}
                className={getTabStyle(chatType)}
              >
                {getTabIcon(chatType)}
                <span className="whitespace-nowrap">{getTabTitle(chatType)}</span>
                {getTabBadge(chatType)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-800 overflow-hidden h-[calc(100vh-200px)]">
          {(activeChat === 'config1' && playerNumber === 1) && (
            <ConfigurationChat
              userId={playerNumber}
              onCharacterComplete={handleCharacterComplete}
            />
          )}
          
          {(activeChat === 'config2' && playerNumber === 2) && (
            <ConfigurationChat
              userId={playerNumber}
              onCharacterComplete={handleCharacterComplete}
            />
          )}
          
          {activeChat === 'battle' && (
            <BattleArena
              character1={character1}
              character2={character2}
              onBattleEnd={handleBattleEnd}
              currentPlayer={playerNumber}
              gameState={gameState}
              onStartBattle={startBattle}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-sm border-t border-gray-800 py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            Sala: {roomId} • Powered by Google Gemini AI • Batalhas épicas de rima em tempo real
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;