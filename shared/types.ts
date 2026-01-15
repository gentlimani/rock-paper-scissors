// Shared types between client and server

export interface Player {
  id: string; // socket.id
  name: string;
  score: number;
}

export interface GameState {
  roomId: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  moves: Record<string, 'rock' | 'paper' | 'scissors'>; // Key is socket.id
  spectators?: string[]; // socket ids of spectators
}

// Leaderboard entry
export interface LeaderboardEntry {
  name: string;
  oddsChallange: number;
  wins: number;
  losses: number;
  ties: number;
  score: number; // Win = 2 points, Tie = 1 point, Loss = 0
  winRate: number;
  rank: number;
}

// Tournament types
export interface TournamentPlayer {
  id: string;
  name: string;
  seed: number;
}

export interface TournamentMatch {
  id: string;
  round: number;
  position: number;
  player1: TournamentPlayer | null;
  player2: TournamentPlayer | null;
  winner: TournamentPlayer | null;
  status: 'pending' | 'in_progress' | 'completed';
  roomId?: string;
}

export interface Tournament {
  id: string;
  name: string;
  status: 'waiting' | 'in_progress' | 'completed';
  players: TournamentPlayer[];
  matches: TournamentMatch[];
  currentRound: number;
  maxPlayers: number;
  winner?: TournamentPlayer;
}

// Live match info for spectators
export interface LiveMatch {
  roomId: string;
  player1: { name: string; score: number };
  player2: { name: string; score: number };
  spectatorCount: number;
}

// Client to Server Events
export interface ClientToServerEvents {
  join_queue: (data?: { playerName: string }) => void;
  submit_move: (data: { move: 'rock' | 'paper' | 'scissors' }) => void;
  play_again: () => void;
  quit_game: () => void;
  // Spectator events
  get_live_matches: () => void;
  spectate_match: (data: { roomId: string }) => void;
  leave_spectate: () => void;
  // Leaderboard events
  get_leaderboard: () => void;
  update_player_name: (data: { name: string }) => void;
  // Tournament events
  get_tournaments: () => void;
  create_tournament: (data: { name: string; maxPlayers: number }) => void;
  join_tournament: (data: { tournamentId: string }) => void;
  leave_tournament: (data: { tournamentId: string }) => void;
}

// Server to Client Events
export interface ServerToClientEvents {
  match_found: (data: { roomId: string; opponentId: string; opponentName: string }) => void;
  game_start: (data: GameState) => void;
  round_result: (data: { winnerId: string | null; moves: { p1: 'rock' | 'paper' | 'scissors'; p2: 'rock' | 'paper' | 'scissors' } }) => void;
  opponent_left: () => void;
  // Spectator events
  live_matches: (data: LiveMatch[]) => void;
  spectate_update: (data: GameState) => void;
  spectator_joined: (data: { count: number }) => void;
  // Leaderboard events
  leaderboard: (data: LeaderboardEntry[]) => void;
  // Tournament events
  tournaments_list: (data: Tournament[]) => void;
  tournament_update: (data: Tournament) => void;
  tournament_match_ready: (data: { tournamentId: string; matchId: string; opponent: TournamentPlayer }) => void;
}
