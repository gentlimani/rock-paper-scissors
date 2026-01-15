import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ServerToClientEvents, ClientToServerEvents, GameState, Player, LiveMatch } from '../shared/types.js';
import { gameStore } from './store.js';
import { getLeaderboard, recordWin, recordLoss, recordTie, getOrCreatePlayer, initDatabase } from './leaderboard.js';
import { createTournament, joinTournament, leaveTournament, getTournaments, getTournament, recordMatchResult, getPlayerPendingMatch } from './tournament.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Serve static files from the client build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../../client/dist')));
}

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? false // Same origin in production
      : 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Matchmaking queue with player names
const matchmakingQueue: { id: string; name: string }[] = [];

// Bot players map: roomId -> botId
const botPlayers = new Map<string, string>();

// Player names map: socketId -> name
const playerNames = new Map<string, string>();

// Spectators map: socketId -> roomId they're watching
const spectators = new Map<string, string>();

// Track which games have already recorded their final result (to prevent double-counting)
const gamesRecorded = new Set<string>();

// Helper function to generate room ID
const generateRoomId = (): string => {
  return `room_${Math.random().toString(36).substring(2, 9)}`;
};

// Helper function to generate bot ID
const generateBotId = (): string => {
  return `bot_${Math.random().toString(36).substring(2, 9)}`;
};

// Helper function to create a bot match
const createBotMatch = (playerId: string, playerName: string) => {
  const botId = generateBotId();
  const roomId = generateRoomId();
  
  const player: Player = { id: playerId, name: playerName, score: 0 };
  const bot: Player = { id: botId, name: '🤖 CPU', score: 0 };

  const gameState: GameState = {
    roomId,
    players: [player, bot],
    status: 'waiting',
    moves: {},
    spectators: [],
  };

  gameStore.set(roomId, gameState);
  botPlayers.set(roomId, botId);

  // Join player to the room
  io.sockets.sockets.get(playerId)?.join(roomId);

  // Notify player
  io.to(playerId).emit('match_found', { roomId, opponentId: botId, opponentName: '🤖 CPU' });
  io.to(roomId).emit('game_start', gameState);

  console.log(`Bot match created: ${playerName} vs CPU in room ${roomId}`);
};

// Helper function to calculate winner
const calculateWinner = (
  move1: 'rock' | 'paper' | 'scissors',
  move2: 'rock' | 'paper' | 'scissors'
): 'p1' | 'p2' | 'tie' => {
  if (move1 === move2) return 'tie';
  
  if (
    (move1 === 'rock' && move2 === 'scissors') ||
    (move1 === 'paper' && move2 === 'rock') ||
    (move1 === 'scissors' && move2 === 'paper')
  ) {
    return 'p1';
  }
  
  return 'p2';
};

// Get live matches for spectators
const getLiveMatches = (): LiveMatch[] => {
  const matches: LiveMatch[] = [];
  
  gameStore.forEach((gameState: GameState, roomId: string) => {
    // Only show human vs human matches (not bot matches)
    if (!botPlayers.has(roomId) && gameState.players.length === 2) {
      matches.push({
        roomId,
        player1: { name: gameState.players[0].name, score: gameState.players[0].score },
        player2: { name: gameState.players[1].name, score: gameState.players[1].score },
        spectatorCount: gameState.spectators?.length || 0,
      });
    }
  });
  
  return matches;
};

// Broadcast live matches update to all connected clients
const broadcastLiveMatches = () => {
  io.emit('live_matches', getLiveMatches());
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle join queue
  socket.on('join_queue', async (data: { playerName: string } | undefined) => {
    const playerName = data?.playerName || playerNames.get(socket.id) || 'Anonymous';
    playerNames.set(socket.id, playerName);
    await getOrCreatePlayer(playerName); // Register in leaderboard
    
    if (matchmakingQueue.some((p: { id: string; name: string }) => p.id === socket.id)) {
      return; // Already in queue
    }

    matchmakingQueue.push({ id: socket.id, name: playerName });
    console.log(`Player ${playerName} joined queue. Queue length: ${matchmakingQueue.length}`);

    // Try to match players
    if (matchmakingQueue.length >= 2) {
      const player1 = matchmakingQueue.shift()!;
      const player2 = matchmakingQueue.shift()!;

      const roomId = generateRoomId();
      const p1: Player = { id: player1.id, name: player1.name, score: 0 };
      const p2: Player = { id: player2.id, name: player2.name, score: 0 };

      const gameState: GameState = {
        roomId,
        players: [p1, p2],
        status: 'waiting',
        moves: {},
        spectators: [],
      };

      gameStore.set(roomId, gameState);

      // Join both players to the room
      io.sockets.sockets.get(player1.id)?.join(roomId);
      io.sockets.sockets.get(player2.id)?.join(roomId);

      // Notify both players
      io.to(player1.id).emit('match_found', { roomId, opponentId: player2.id, opponentName: player2.name });
      io.to(player2.id).emit('match_found', { roomId, opponentId: player1.id, opponentName: player1.name });
      
      // Emit game_start with initial state
      io.to(roomId).emit('game_start', gameState);

      console.log(`Match created: ${player1.name} vs ${player2.name} in room ${roomId}`);
      
      // Broadcast updated live matches
      broadcastLiveMatches();
    } else {
      // If no match found, wait 3 seconds then match with bot
      setTimeout(() => {
        const queueIndex = matchmakingQueue.findIndex((p: { id: string; name: string }) => p.id === socket.id);
        if (queueIndex !== -1) {
          // Still in queue, match with bot
          const player = matchmakingQueue.splice(queueIndex, 1)[0];
          createBotMatch(socket.id, player.name);
        }
      }, 3000);
    }
  });

  // Handle player name update
  socket.on('update_player_name', async ({ name }: { name: string }) => {
    playerNames.set(socket.id, name);
    await getOrCreatePlayer(name);
  });

  // Handle submit move
  socket.on('submit_move', ({ move }: { move: 'rock' | 'paper' | 'scissors' }) => {
    // Find the room this player is in
    let playerRoom: string | null = null;
    for (const [roomId, gameState] of gameStore.entries()) {
      if (gameState.players.some((p: Player) => p.id === socket.id)) {
        playerRoom = roomId;
        break;
      }
    }

    if (!playerRoom) {
      console.log(`Player ${socket.id} tried to submit move but not in a room`);
      return;
    }

    const gameState = gameStore.get(playerRoom);
    if (!gameState) return;

    // Store the move
    gameState.moves[socket.id] = move;
    gameState.status = 'playing';

    const playerName = playerNames.get(socket.id) || 'Anonymous';
    console.log(`Player ${playerName} submitted ${move} in room ${playerRoom}`);

    // Notify spectators of update
    if (gameState.spectators && gameState.spectators.length > 0) {
      gameState.spectators.forEach((spectatorId: string) => {
        io.to(spectatorId).emit('spectate_update', { ...gameState, moves: {} }); // Don't reveal moves
      });
    }

    // Check if opponent is a bot
    const botId = botPlayers.get(playerRoom);
    const opponent = gameState.players.find((p: Player) => p.id !== socket.id);
    
    if (botId && opponent && opponent.id === botId && !gameState.moves[botId]) {
      // Bot's turn - make a random move after a short delay
      setTimeout(() => {
        const botMove: 'rock' | 'paper' | 'scissors' = ['rock', 'paper', 'scissors'][
          Math.floor(Math.random() * 3)
        ] as 'rock' | 'paper' | 'scissors';
        
        gameState.moves[botId] = botMove;
        console.log(`Bot submitted ${botMove} in room ${playerRoom}`);
        
        // Process the round result
        processRoundResult(playerRoom!, gameState);
      }, 1000 + Math.random() * 1000);
    } else {
      // Check if both players have moved
      if (Object.keys(gameState.moves).length === 2) {
        processRoundResult(playerRoom, gameState);
      }
    }
  });

  // Helper function to process round results
  const processRoundResult = async (roomId: string, gameState: GameState) => {
    const [player1, player2] = gameState.players;
    const move1 = gameState.moves[player1.id];
    const move2 = gameState.moves[player2.id];
    const WINNING_SCORE = 2; // First to 2 wins

    if (move1 && move2) {
      const result = calculateWinner(move1, move2);
      let winnerId: string | null = null;

      if (result === 'p1') {
        winnerId = player1.id;
        player1.score += 1;
      } else if (result === 'tie') {
        winnerId = null;
      } else {
        winnerId = player2.id;
        player2.score += 1;
      }

      // Check if someone won the GAME (best of 3)
      if (player1.score >= WINNING_SCORE && !gamesRecorded.has(roomId)) {
        // Player 1 wins the game
        gamesRecorded.add(roomId);
        console.log(`GAME WON: ${player1.name} beat ${player2.name} (${player1.score}-${player2.score})`);
        await recordWin(player1.name);
        await recordLoss(player2.name);
      } else if (player2.score >= WINNING_SCORE && !gamesRecorded.has(roomId)) {
        // Player 2 wins the game
        gamesRecorded.add(roomId);
        console.log(`GAME WON: ${player2.name} beat ${player1.name} (${player2.score}-${player1.score})`);
        await recordWin(player2.name);
        await recordLoss(player1.name);
      }

      // Emit round result to both players
      io.to(roomId).emit('round_result', {
        winnerId,
        moves: { p1: move1, p2: move2 },
      });

      // Notify spectators with full result
      if (gameState.spectators && gameState.spectators.length > 0) {
        gameState.spectators.forEach((spectatorId: string) => {
          io.to(spectatorId).emit('spectate_update', gameState);
          io.to(spectatorId).emit('round_result', {
            winnerId,
            moves: { p1: move1, p2: move2 },
          });
        });
      }

      // Reset moves for next round
      gameState.moves = {};
      gameState.status = 'waiting';

      console.log(`Round result in ${roomId}: ${winnerId ? (gameState.players.find((p: Player) => p.id === winnerId)?.name || 'Unknown') : 'Tie'}`);
      
      // Broadcast updated live matches
      broadcastLiveMatches();
    }
  };

  // Handle play again
  socket.on('play_again', () => {
    let playerRoom: string | null = null;
    for (const [roomId, gameState] of gameStore.entries()) {
      if (gameState.players.some((p: Player) => p.id === socket.id)) {
        playerRoom = roomId;
        break;
      }
    }

    if (!playerRoom) return;

    const gameState = gameStore.get(playerRoom);
    if (!gameState) return;

    // Reset game state for new match
    gameState.moves = {};
    gameState.status = 'waiting';
    // Reset player scores for new game
    gameState.players.forEach((p: Player) => {
      p.score = 0;
    });
    // Clear the recorded flag so new game can be tracked
    gamesRecorded.delete(playerRoom);

    const opponent = gameState.players.find((p: Player) => p.id !== socket.id);
    if (opponent) {
      io.to(socket.id).emit('match_found', {
        roomId: playerRoom,
        opponentId: opponent.id,
        opponentName: opponent.name,
      });
      
      if (!opponent.id.startsWith('bot_')) {
        io.to(opponent.id).emit('match_found', {
          roomId: playerRoom,
          opponentId: socket.id,
          opponentName: playerNames.get(socket.id) || 'Anonymous',
        });
      }
      
      io.to(playerRoom).emit('game_start', gameState);
    }
  });

  // Handle quit game
  socket.on('quit_game', () => {
    console.log('User quit game:', socket.id);

    for (const [roomId, gameState] of gameStore.entries()) {
      if (gameState.players.some((p: Player) => p.id === socket.id)) {
        const opponent = gameState.players.find((p: Player) => p.id !== socket.id);
        if (opponent && !opponent.id.startsWith('bot_')) {
          io.to(opponent.id).emit('opponent_left');
        }

        // Notify spectators
        if (gameState.spectators) {
          gameState.spectators.forEach((spectatorId: string) => {
            io.to(spectatorId).emit('opponent_left');
            spectators.delete(spectatorId);
          });
        }

        socket.leave(roomId);
        botPlayers.delete(roomId);
        gamesRecorded.delete(roomId);
        gameStore.delete(roomId);
        console.log(`Room ${roomId} cleaned up due to quit`);
        
        broadcastLiveMatches();
        break;
      }
    }
  });

  // ============ SPECTATOR EVENTS ============
  
  socket.on('get_live_matches', () => {
    socket.emit('live_matches', getLiveMatches());
  });

  socket.on('spectate_match', ({ roomId }: { roomId: string }) => {
    const gameState = gameStore.get(roomId);
    if (!gameState) return;

    // Leave any previous spectating
    const previousRoom = spectators.get(socket.id);
    if (previousRoom) {
      const prevGame = gameStore.get(previousRoom);
      if (prevGame && prevGame.spectators) {
        prevGame.spectators = prevGame.spectators.filter((id: string) => id !== socket.id);
      }
      socket.leave(`spectate_${previousRoom}`);
    }

    // Join as spectator
    spectators.set(socket.id, roomId);
    if (!gameState.spectators) gameState.spectators = [];
    gameState.spectators.push(socket.id);
    socket.join(`spectate_${roomId}`);

    // Send current game state (without moves)
    socket.emit('spectate_update', { ...gameState, moves: {} });
    
    // Notify room of new spectator count
    io.to(roomId).emit('spectator_joined', { count: gameState.spectators.length });
    
    console.log(`${socket.id} started spectating ${roomId}`);
  });

  socket.on('leave_spectate', () => {
    const roomId = spectators.get(socket.id);
    if (!roomId) return;

    const gameState = gameStore.get(roomId);
    if (gameState && gameState.spectators) {
      gameState.spectators = gameState.spectators.filter((id: string) => id !== socket.id);
      io.to(roomId).emit('spectator_joined', { count: gameState.spectators.length });
    }

    spectators.delete(socket.id);
    socket.leave(`spectate_${roomId}`);
  });

  // ============ LEADERBOARD EVENTS ============
  
  socket.on('get_leaderboard', async () => {
    const leaderboard = await getLeaderboard();
    socket.emit('leaderboard', leaderboard);
  });

  // ============ TOURNAMENT EVENTS ============
  
  socket.on('get_tournaments', () => {
    socket.emit('tournaments_list', getTournaments());
  });

  socket.on('create_tournament', ({ name, maxPlayers }: { name: string; maxPlayers: number }) => {
    createTournament(name, maxPlayers);
    io.emit('tournaments_list', getTournaments());
    console.log(`Tournament created: ${name}`);
  });

  socket.on('join_tournament', ({ tournamentId }: { tournamentId: string }) => {
    const playerName = playerNames.get(socket.id) || 'Anonymous';
    const tournament = joinTournament(tournamentId, socket.id, playerName);
    
    if (tournament) {
      io.emit('tournaments_list', getTournaments());
      io.emit('tournament_update', tournament);
      
      // Check if tournament started and player has a match
      if (tournament.status === 'in_progress') {
        const match = getPlayerPendingMatch(tournamentId, socket.id);
        if (match) {
          const opponent = match.player1?.id === socket.id ? match.player2 : match.player1;
          if (opponent) {
            socket.emit('tournament_match_ready', {
              tournamentId,
              matchId: match.id,
              opponent,
            });
          }
        }
      }
    }
  });

  socket.on('leave_tournament', ({ tournamentId }: { tournamentId: string }) => {
    const tournament = leaveTournament(tournamentId, socket.id);
    if (tournament) {
      io.emit('tournaments_list', getTournaments());
      io.emit('tournament_update', tournament);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove from queue
    const queueIndex = matchmakingQueue.findIndex((p: { id: string; name: string }) => p.id === socket.id);
    if (queueIndex !== -1) {
      matchmakingQueue.splice(queueIndex, 1);
    }

    // Remove from spectators
    const spectatingRoom = spectators.get(socket.id);
    if (spectatingRoom) {
      const gameState = gameStore.get(spectatingRoom);
      if (gameState && gameState.spectators) {
        gameState.spectators = gameState.spectators.filter((id: string) => id !== socket.id);
      }
      spectators.delete(socket.id);
    }

    // Clean up game room
    for (const [roomId, gameState] of gameStore.entries()) {
      if (gameState.players.some((p: Player) => p.id === socket.id)) {
        const opponent = gameState.players.find((p: Player) => p.id !== socket.id);
        if (opponent && !opponent.id.startsWith('bot_')) {
          io.to(opponent.id).emit('opponent_left');
        }

        // Notify spectators
        if (gameState.spectators) {
          gameState.spectators.forEach((spectatorId: string) => {
            io.to(spectatorId).emit('opponent_left');
            spectators.delete(spectatorId);
          });
        }

        botPlayers.delete(roomId);
        gamesRecorded.delete(roomId);
        gameStore.delete(roomId);
        console.log(`Room ${roomId} cleaned up due to disconnect`);
        
        broadcastLiveMatches();
        break;
      }
    }

    playerNames.delete(socket.id);
  });
});

// Serve client app for any other routes (SPA fallback) in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../client/dist/index.html'));
  });
}

const PORT = process.env.PORT || 3000;

// Initialize database and start server
const startServer = async () => {
  await initDatabase();
  
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
