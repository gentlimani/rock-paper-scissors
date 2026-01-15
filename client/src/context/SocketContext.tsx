import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, GameState } from '@shared/types';
import sounds from '../utils/sounds';

interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  gameState: GameState | null;
  opponentId: string | null;
  isSearching: boolean;
  playerName: string | null;
  setPlayerName: (name: string) => void;
  joinQueue: () => void;
  playAgain: () => void;
  quitGame: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  gameState: null,
  opponentId: null,
  isSearching: false,
  playerName: null,
  setPlayerName: () => {},
  joinQueue: () => {},
  playAgain: () => {},
  quitGame: () => {},
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);

  useEffect(() => {
    // In production, connect to same origin; in dev, connect to localhost:3000
    const serverUrl = import.meta.env.PROD ? window.location.origin : 'http://localhost:3000';
    const socketInstance = io(serverUrl);

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setGameState(null);
      setOpponentId(null);
      setIsSearching(false);
    });

    socketInstance.on('match_found', (data) => {
      console.log('Match found:', data);
      sounds.matchFound();
      setIsSearching(false);
      setOpponentId(data.opponentId);
      // Initialize game state only if new game (preserve scores for play again)
      setGameState((prev: GameState | null) => {
        // If same room, keep existing scores
        if (prev && prev.roomId === data.roomId) {
          return {
            ...prev,
            status: 'waiting' as const,
            moves: {},
          };
        }
        // New game, start fresh
        return {
          roomId: data.roomId,
          players: [
            { id: socketInstance.id!, name: '', score: 0 },
            { id: data.opponentId, name: data.opponentName, score: 0 },
          ],
          status: 'waiting' as const,
          moves: {},
        };
      });
    });

    socketInstance.on('game_start', (data) => {
      console.log('Game started:', data);
      // Preserve client-side scores if they exist
      setGameState((prev: GameState | null) => {
        if (prev && prev.roomId === data.roomId) {
          return {
            ...data,
            players: prev.players, // Keep client scores
          };
        }
        return data;
      });
    });

    socketInstance.on('round_result', (data) => {
      console.log('Round result:', data);
      // Update game state with new scores
      setGameState((prev: GameState | null) => {
        if (!prev) return null;
        const updated = { ...prev, players: [...prev.players] };
        if (data.winnerId) {
          const winner = updated.players.find((p: { id: string; score: number }) => p.id === data.winnerId);
          if (winner) {
            winner.score += 1;
          }
        }
        return updated;
      });
    });

    socketInstance.on('opponent_left', () => {
      console.log('Opponent left');
      sounds.opponentLeft();
      alert('Opponent disconnected. Returning to lobby...');
      setGameState(null);
      setOpponentId(null);
      setIsSearching(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.close();
    };
  }, []);

  const joinQueue = () => {
    if (socket && !isSearching && playerName) {
      setIsSearching(true);
      socket.emit('join_queue', { playerName });
    }
  };

  const playAgain = () => {
    if (socket) {
      socket.emit('play_again');
    }
  };

  const quitGame = () => {
    if (socket) {
      socket.emit('quit_game');
      setGameState(null);
      setOpponentId(null);
      setPlayerName(null); // Reset name to ask again
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        gameState,
        opponentId,
        isSearching,
        playerName,
        setPlayerName,
        joinQueue,
        playAgain,
        quitGame,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
