import type { Tournament, TournamentPlayer, TournamentMatch } from '../shared/types.js';

// In-memory tournament storage
const tournaments = new Map<string, Tournament>();

// Generate unique tournament ID
const generateTournamentId = (): string => {
  return `tournament_${Math.random().toString(36).substring(2, 9)}`;
};

// Generate match ID
const generateMatchId = (): string => {
  return `match_${Math.random().toString(36).substring(2, 9)}`;
};

// Create bracket matches for a tournament
const createBracketMatches = (players: TournamentPlayer[]): TournamentMatch[] => {
  const matches: TournamentMatch[] = [];
  const numPlayers = players.length;
  const numRounds = Math.ceil(Math.log2(numPlayers));
  
  // First round matches
  let matchPosition = 0;
  for (let i = 0; i < numPlayers; i += 2) {
    matches.push({
      id: generateMatchId(),
      round: 1,
      position: matchPosition++,
      player1: players[i] || null,
      player2: players[i + 1] || null,
      winner: null,
      status: players[i] && players[i + 1] ? 'pending' : 'pending',
    });
  }
  
  // Create placeholder matches for subsequent rounds
  let prevRoundMatches = matches.length;
  for (let round = 2; round <= numRounds; round++) {
    const numMatches = Math.ceil(prevRoundMatches / 2);
    for (let i = 0; i < numMatches; i++) {
      matches.push({
        id: generateMatchId(),
        round,
        position: i,
        player1: null,
        player2: null,
        winner: null,
        status: 'pending',
      });
    }
    prevRoundMatches = numMatches;
  }
  
  return matches;
};

// Create a new tournament
export const createTournament = (name: string, maxPlayers: number): Tournament => {
  const tournament: Tournament = {
    id: generateTournamentId(),
    name,
    status: 'waiting',
    players: [],
    matches: [],
    currentRound: 0,
    maxPlayers: Math.min(Math.max(maxPlayers, 4), 16), // 4-16 players
  };
  
  tournaments.set(tournament.id, tournament);
  return tournament;
};

// Join a tournament
export const joinTournament = (tournamentId: string, playerId: string, playerName: string): Tournament | null => {
  const tournament = tournaments.get(tournamentId);
  if (!tournament || tournament.status !== 'waiting') return null;
  if (tournament.players.length >= tournament.maxPlayers) return null;
  if (tournament.players.some(p => p.id === playerId)) return null;
  
  tournament.players.push({
    id: playerId,
    name: playerName,
    seed: tournament.players.length + 1,
  });
  
  // Auto-start if full
  if (tournament.players.length === tournament.maxPlayers) {
    startTournament(tournamentId);
  }
  
  return tournament;
};

// Leave a tournament (only before it starts)
export const leaveTournament = (tournamentId: string, playerId: string): Tournament | null => {
  const tournament = tournaments.get(tournamentId);
  if (!tournament || tournament.status !== 'waiting') return null;
  
  tournament.players = tournament.players.filter(p => p.id !== playerId);
  
  // Re-assign seeds
  tournament.players.forEach((p, i) => {
    p.seed = i + 1;
  });
  
  return tournament;
};

// Start a tournament
export const startTournament = (tournamentId: string): Tournament | null => {
  const tournament = tournaments.get(tournamentId);
  if (!tournament || tournament.status !== 'waiting') return null;
  if (tournament.players.length < 2) return null;
  
  // Shuffle players for seeding
  const shuffled = [...tournament.players].sort(() => Math.random() - 0.5);
  shuffled.forEach((p, i) => {
    p.seed = i + 1;
  });
  
  tournament.matches = createBracketMatches(shuffled);
  tournament.status = 'in_progress';
  tournament.currentRound = 1;
  
  return tournament;
};

// Record match result
export const recordMatchResult = (tournamentId: string, matchId: string, winnerId: string): Tournament | null => {
  const tournament = tournaments.get(tournamentId);
  if (!tournament) return null;
  
  const match = tournament.matches.find(m => m.id === matchId);
  if (!match || match.status === 'completed') return null;
  
  const winner = match.player1?.id === winnerId ? match.player1 : match.player2;
  if (!winner) return null;
  
  match.winner = winner;
  match.status = 'completed';
  
  // Advance winner to next round
  const nextRoundMatches = tournament.matches.filter(m => m.round === match.round + 1);
  if (nextRoundMatches.length > 0) {
    const nextMatchIndex = Math.floor(match.position / 2);
    const nextMatch = nextRoundMatches[nextMatchIndex];
    if (nextMatch) {
      if (match.position % 2 === 0) {
        nextMatch.player1 = winner;
      } else {
        nextMatch.player2 = winner;
      }
      
      // Check if next match is ready
      if (nextMatch.player1 && nextMatch.player2) {
        nextMatch.status = 'pending';
      }
    }
  } else {
    // This was the final match
    tournament.winner = winner;
    tournament.status = 'completed';
  }
  
  // Check if current round is complete
  const currentRoundMatches = tournament.matches.filter(m => m.round === tournament.currentRound);
  if (currentRoundMatches.every(m => m.status === 'completed')) {
    tournament.currentRound += 1;
  }
  
  return tournament;
};

// Get all tournaments
export const getTournaments = (): Tournament[] => {
  return Array.from(tournaments.values());
};

// Get a specific tournament
export const getTournament = (tournamentId: string): Tournament | null => {
  return tournaments.get(tournamentId) || null;
};

// Get pending matches for a player
export const getPlayerPendingMatch = (tournamentId: string, playerId: string): TournamentMatch | null => {
  const tournament = tournaments.get(tournamentId);
  if (!tournament) return null;
  
  return tournament.matches.find(m => 
    m.status === 'pending' &&
    (m.player1?.id === playerId || m.player2?.id === playerId)
  ) || null;
};

// Delete old completed tournaments (cleanup)
export const cleanupTournaments = (): void => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  // In a real app, you'd track creation time
  // For now, just remove completed tournaments if there are too many
  if (tournaments.size > 50) {
    const completed = Array.from(tournaments.entries())
      .filter(([_, t]) => t.status === 'completed')
      .slice(0, 25);
    
    completed.forEach(([id]) => tournaments.delete(id));
  }
};
