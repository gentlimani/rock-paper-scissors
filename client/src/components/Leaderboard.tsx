import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import type { LeaderboardEntry } from '@shared/types';

interface LeaderboardProps {
  onClose: () => void;
}

export const Leaderboard = ({ onClose }: LeaderboardProps) => {
  const { socket } = useSocket();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket) return;

    socket.emit('get_leaderboard');

    const handleLeaderboard = (data: LeaderboardEntry[]) => {
      setEntries(data);
      setLoading(false);
    };

    socket.on('leaderboard', handleLeaderboard);

    return () => {
      socket.off('leaderboard', handleLeaderboard);
    };
  }, [socket]);

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900/95 border border-cyan-500/30 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl shadow-cyan-500/20"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
            🏆 Leaderboard
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </motion.button>
        </div>

        {/* ASCII Art Header */}
        <pre className="text-cyan-500 text-[8px] leading-[8px] mb-4 font-mono text-center opacity-50">
{`
 _     ___   __   ___   ___  ___  ___   __    __   ___  ___  
| |   | __| /  \\ |   \\ | __|| _ \\| _ ) /  \\  /  \\ | _ \\|   \\ 
| |__ | _| | () || |) || _| |   /| _ \\| () || () ||   /| |) |
|____||___| \\__/ |___/ |___||_|_\\|___/ \\__/  \\__/ |_|_\\|___/ 
`}
        </pre>

        {/* Table */}
        <div className="overflow-y-auto max-h-[50vh] scrollbar-thin scrollbar-thumb-cyan-500/30">
          {loading ? (
            <div className="text-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-gray-400">Loading rankings...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg">No players yet!</p>
              <p className="text-gray-500 text-sm mt-2">Be the first to play and get ranked.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="text-gray-400 text-sm border-b border-gray-700">
                <tr>
                  <th className="py-3 px-2 text-left">Rank</th>
                  <th className="py-3 px-2 text-left">Player</th>
                  <th className="py-3 px-2 text-center">Score</th>
                  <th className="py-3 px-2 text-center">W</th>
                  <th className="py-3 px-2 text-center">L</th>
                  <th className="py-3 px-2 text-center">T</th>
                  <th className="py-3 px-2 text-right">Win %</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {entries.map((entry, index) => (
                    <motion.tr
                      key={entry.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className={`py-3 px-2 font-bold ${getRankColor(entry.rank)}`}>
                        {getRankEmoji(entry.rank)}
                      </td>
                      <td className="py-3 px-2 text-white font-medium">
                        {entry.name}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-cyan-400 font-bold font-mono">{entry.score || 0}</span>
                      </td>
                      <td className="py-3 px-2 text-center text-green-400">{entry.wins}</td>
                      <td className="py-3 px-2 text-center text-red-400">{entry.losses}</td>
                      <td className="py-3 px-2 text-center text-yellow-400">{entry.ties}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={`font-mono ${entry.winRate >= 50 ? 'text-green-400' : 'text-gray-400'}`}>
                          {entry.winRate}%
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
