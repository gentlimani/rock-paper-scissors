import type { LeaderboardEntry } from '../shared/types.js';

// In-memory leaderboard storage
// Key: player name (lowercase for uniqueness)
interface PlayerStats {
  name: string;
  oddsChallange: number;
  wins: number;
  losses: number;
  ties: number;
}

const playerStats = new Map<string, PlayerStats>();

export const getOrCreatePlayer = (name: string): PlayerStats => {
  const key = name.toLowerCase();
  if (!playerStats.has(key)) {
    playerStats.set(key, {
      name,
      oddsChallange: 0,
      wins: 0,
      losses: 0,
      ties: 0,
    });
  }
  return playerStats.get(key)!;
};

export const recordWin = (playerName: string): void => {
  const stats = getOrCreatePlayer(playerName);
  stats.wins += 1;
};

export const recordLoss = (playerName: string): void => {
  const stats = getOrCreatePlayer(playerName);
  stats.losses += 1;
};

export const recordTie = (playerName: string): void => {
  const stats = getOrCreatePlayer(playerName);
  stats.ties += 1;
};

export const getLeaderboard = (): LeaderboardEntry[] => {
  const entries: LeaderboardEntry[] = [];
  
  playerStats.forEach((stats) => {
    const totalGames = stats.wins + stats.losses + stats.ties;
    const winRate = totalGames > 0 ? (stats.wins / totalGames) * 100 : 0;
    
    entries.push({
      name: stats.name,
      oddsChallange: stats.oddsChallange,
      wins: stats.wins,
      losses: stats.losses,
      ties: stats.ties,
      winRate: Math.round(winRate * 10) / 10,
      rank: 0, // Will be set after sorting
    });
  });
  
  // Sort by wins, then by win rate
  entries.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.winRate - a.winRate;
  });
  
  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  return entries.slice(0, 100); // Top 100
};
