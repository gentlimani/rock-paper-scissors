import type { GameState } from '../shared/types.js';

// In-memory store for game states
// Key: roomId, Value: GameState
export const gameStore = new Map<string, GameState>();
