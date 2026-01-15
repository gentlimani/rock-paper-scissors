import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import type { LiveMatch, GameState } from '@shared/types';

interface SpectateProps {
  onClose: () => void;
}

export const Spectate = ({ onClose }: SpectateProps) => {
  const { socket } = useSocket();
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [watching, setWatching] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket) return;

    socket.emit('get_live_matches');

    const handleLiveMatches = (data: LiveMatch[]) => {
      setLiveMatches(data);
      setLoading(false);
    };

    const handleSpectateUpdate = (data: GameState) => {
      setWatching(data);
    };

    const handleOpponentLeft = () => {
      setWatching(null);
      socket.emit('get_live_matches');
    };

    socket.on('live_matches', handleLiveMatches);
    socket.on('spectate_update', handleSpectateUpdate);
    socket.on('opponent_left', handleOpponentLeft);

    // Refresh live matches every 5 seconds
    const interval = setInterval(() => {
      if (!watching) {
        socket.emit('get_live_matches');
      }
    }, 5000);

    return () => {
      socket.off('live_matches', handleLiveMatches);
      socket.off('spectate_update', handleSpectateUpdate);
      socket.off('opponent_left', handleOpponentLeft);
      socket.emit('leave_spectate');
      clearInterval(interval);
    };
  }, [socket, watching]);

  const joinSpectate = (roomId: string) => {
    if (socket) {
      socket.emit('spectate_match', { roomId });
    }
  };

  const leaveSpectate = () => {
    if (socket) {
      socket.emit('leave_spectate');
      setWatching(null);
    }
  };

  if (watching) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-gray-900/95 border border-cyan-500/30 rounded-2xl p-6 max-w-3xl w-full shadow-2xl"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-red-500 text-2xl"
              >
                🔴
              </motion.span>
              <h2 className="text-2xl font-bold text-white">LIVE</h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={leaveSpectate}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-white"
            >
              ← Back to Matches
            </motion.button>
          </div>

          {/* Spectating View */}
          <div className="grid grid-cols-2 gap-6">
            {/* Player 1 */}
            <div className="bg-gray-800/50 border border-cyan-500/30 rounded-xl p-6 text-center">
              <h3 className="text-xl font-bold text-cyan-400 mb-2">
                {watching.players[0]?.name || 'Player 1'}
              </h3>
              <p className="text-4xl font-bold text-white mb-4">
                {watching.players[0]?.score || 0}
              </p>
              <div className="h-24 flex items-center justify-center">
                {watching.status === 'playing' ? (
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-4xl"
                  >
                    🤔
                  </motion.span>
                ) : (
                  <span className="text-gray-500 text-2xl">⏳</span>
                )}
              </div>
            </div>

            {/* Player 2 */}
            <div className="bg-gray-800/50 border border-magenta-500/30 rounded-xl p-6 text-center">
              <h3 className="text-xl font-bold text-magenta-400 mb-2">
                {watching.players[1]?.name || 'Player 2'}
              </h3>
              <p className="text-4xl font-bold text-white mb-4">
                {watching.players[1]?.score || 0}
              </p>
              <div className="h-24 flex items-center justify-center">
                {watching.status === 'playing' ? (
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-4xl"
                  >
                    🤔
                  </motion.span>
                ) : (
                  <span className="text-gray-500 text-2xl">⏳</span>
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-gray-500 mt-6">
            👁️ Watching live match • Moves hidden until reveal
          </p>
        </motion.div>
      </motion.div>
    );
  }

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
        className="bg-gray-900/95 border border-cyan-500/30 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-magenta-400 bg-clip-text text-transparent">
            👁️ Live Matches
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

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-gray-400">Finding live matches...</p>
            </div>
          ) : liveMatches.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-6xl block mb-4">📺</span>
              <p className="text-gray-400 text-lg">No live matches right now</p>
              <p className="text-gray-500 text-sm mt-2">Check back soon or start your own game!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {liveMatches.map((match) => (
                <motion.div
                  key={match.roomId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-800/50 border border-gray-700 hover:border-cyan-500/50 rounded-xl p-4 cursor-pointer transition-colors"
                  onClick={() => joinSpectate(match.roomId)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-red-500"
                      >
                        🔴
                      </motion.span>
                      <div>
                        <p className="text-white font-medium">
                          <span className="text-cyan-400">{match.player1.name}</span>
                          {' vs '}
                          <span className="text-magenta-400">{match.player2.name}</span>
                        </p>
                        <p className="text-gray-500 text-sm">
                          Score: {match.player1.score} - {match.player2.score}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">
                        👁️ {match.spectatorCount} watching
                      </p>
                      <p className="text-cyan-400 text-sm font-medium">Click to watch →</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
