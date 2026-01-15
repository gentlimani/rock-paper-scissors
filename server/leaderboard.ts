import pg from 'pg';
import type { LeaderboardEntry } from '../shared/types.js';

const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// In-memory fallback for development without database
interface PlayerStats {
  name: string;
  oddsChallange: number;
  wins: number;
  losses: number;
  ties: number;
}

const memoryStore = new Map<string, PlayerStats>();

// Initialize database table
export const initDatabase = async (): Promise<void> => {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL set, using in-memory storage (data will not persist)');
    return;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        name VARCHAR(255) PRIMARY KEY,
        display_name VARCHAR(255) NOT NULL,
        odds_challenge INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        ties INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};

// Check if database is available
const isDatabaseAvailable = (): boolean => {
  return !!process.env.DATABASE_URL;
};

export const getOrCreatePlayer = async (name: string): Promise<PlayerStats> => {
  const key = name.toLowerCase();

  if (!isDatabaseAvailable()) {
    // Use in-memory fallback
    if (!memoryStore.has(key)) {
      memoryStore.set(key, {
        name,
        oddsChallange: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      });
    }
    return memoryStore.get(key)!;
  }

  try {
    // Try to get existing player
    const result = await pool.query(
      'SELECT display_name as name, odds_challenge as "oddsChallange", wins, losses, ties FROM leaderboard WHERE name = $1',
      [key]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Create new player
    await pool.query(
      'INSERT INTO leaderboard (name, display_name, odds_challenge, wins, losses, ties) VALUES ($1, $2, 0, 0, 0, 0)',
      [key, name]
    );

    return {
      name,
      oddsChallange: 0,
      wins: 0,
      losses: 0,
      ties: 0,
    };
  } catch (error) {
    console.error('Error getting/creating player:', error);
    // Fallback to memory
    if (!memoryStore.has(key)) {
      memoryStore.set(key, {
        name,
        oddsChallange: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      });
    }
    return memoryStore.get(key)!;
  }
};

export const recordWin = async (playerName: string): Promise<void> => {
  const key = playerName.toLowerCase();

  if (!isDatabaseAvailable()) {
    const stats = memoryStore.get(key);
    if (stats) stats.wins += 1;
    return;
  }

  try {
    await pool.query(
      `INSERT INTO leaderboard (name, display_name, wins, losses, ties) 
       VALUES ($1, $2, 1, 0, 0)
       ON CONFLICT (name) 
       DO UPDATE SET wins = leaderboard.wins + 1, updated_at = CURRENT_TIMESTAMP`,
      [key, playerName]
    );
  } catch (error) {
    console.error('Error recording win:', error);
  }
};

export const recordLoss = async (playerName: string): Promise<void> => {
  const key = playerName.toLowerCase();

  if (!isDatabaseAvailable()) {
    const stats = memoryStore.get(key);
    if (stats) stats.losses += 1;
    return;
  }

  try {
    await pool.query(
      `INSERT INTO leaderboard (name, display_name, wins, losses, ties) 
       VALUES ($1, $2, 0, 1, 0)
       ON CONFLICT (name) 
       DO UPDATE SET losses = leaderboard.losses + 1, updated_at = CURRENT_TIMESTAMP`,
      [key, playerName]
    );
  } catch (error) {
    console.error('Error recording loss:', error);
  }
};

export const recordTie = async (playerName: string): Promise<void> => {
  const key = playerName.toLowerCase();

  if (!isDatabaseAvailable()) {
    const stats = memoryStore.get(key);
    if (stats) stats.ties += 1;
    return;
  }

  try {
    await pool.query(
      `INSERT INTO leaderboard (name, display_name, wins, losses, ties) 
       VALUES ($1, $2, 0, 0, 1)
       ON CONFLICT (name) 
       DO UPDATE SET ties = leaderboard.ties + 1, updated_at = CURRENT_TIMESTAMP`,
      [key, playerName]
    );
  } catch (error) {
    console.error('Error recording tie:', error);
  }
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  if (!isDatabaseAvailable()) {
    // Use in-memory data
    const entries: LeaderboardEntry[] = [];

    memoryStore.forEach((stats) => {
      const totalGames = stats.wins + stats.losses + stats.ties;
      const winRate = totalGames > 0 ? (stats.wins / totalGames) * 100 : 0;
      // Score: Win = 2, Tie = 1, Loss = 0
      const score = stats.wins * 2 + stats.ties * 1;

      entries.push({
        name: stats.name,
        oddsChallange: stats.oddsChallange,
        wins: stats.wins,
        losses: stats.losses,
        ties: stats.ties,
        score,
        winRate: Math.round(winRate * 10) / 10,
        rank: 0,
      });
    });

    // Sort by score first, then by win rate
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.winRate - a.winRate;
    });

    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries.slice(0, 100);
  }

  try {
    const result = await pool.query(`
      SELECT 
        display_name as name,
        odds_challenge as "oddsChallange",
        wins,
        losses,
        ties,
        (wins * 2 + ties) as score,
        CASE 
          WHEN (wins + losses + ties) > 0 
          THEN ROUND((wins::numeric / (wins + losses + ties)) * 100, 1)
          ELSE 0 
        END as "winRate"
      FROM leaderboard
      ORDER BY score DESC, "winRate" DESC
      LIMIT 100
    `);

    return result.rows.map((row, index) => ({
      ...row,
      score: parseInt(row.score) || 0,
      winRate: parseFloat(row.winRate) || 0,
      rank: index + 1,
    }));
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
};
