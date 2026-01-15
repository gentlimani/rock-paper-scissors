import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RetroBackground } from './RetroBackground';
import { AsciiDisplay } from './AsciiArt';
import { Leaderboard } from './Leaderboard';
import { Spectate } from './Spectate';
import { TournamentBracket } from './TournamentBracket';
import sounds from '../utils/sounds';

interface LobbyProps {
  onJoinQueue: () => void;
  isSearching: boolean;
  playerName: string;
}

export const Lobby = ({ onJoinQueue, isSearching, playerName }: LobbyProps) => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSpectate, setShowSpectate] = useState(false);
  const [showTournaments, setShowTournaments] = useState(false);

  const handleJoinQueue = () => {
    sounds.click();
    onJoinQueue();
  };

  const handleOpenModal = (setter: (v: boolean) => void) => {
    sounds.click();
    setter(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <RetroBackground />
      
      {/* CRT Overlay Effect */}
      <div className="fixed inset-0 pointer-events-none z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyIiBoZWlnaHQ9IjIiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4xKSIvPjwvc3ZnPg==')] opacity-30" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-20 bg-black/80 backdrop-blur-xl border-2 border-cyan-500/50 rounded-none p-8 shadow-[0_0_50px_rgba(0,255,255,0.3)] max-w-lg w-full"
        style={{ 
          boxShadow: '0 0 50px rgba(0,255,255,0.3), inset 0 0 30px rgba(0,255,255,0.1)',
        }}
      >
        {/* ASCII Title */}
        <div className="flex justify-center mb-4">
          <AsciiDisplay type="title" color="text-cyan-400" size="sm" />
        </div>

        {/* Player Welcome */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-6"
        >
          <p className="text-gray-500 text-sm font-mono">PLAYER:</p>
          <p className="text-cyan-400 text-xl font-mono font-bold">{playerName}</p>
        </motion.div>

        {/* ASCII Hands Animation */}
        <div className="flex justify-center gap-6 mb-8">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          >
            <AsciiDisplay type="rock" color="text-cyan-400" size="sm" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          >
            <AsciiDisplay type="paper" color="text-purple-400" size="sm" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          >
            <AsciiDisplay type="scissors" color="text-pink-400" size="sm" />
          </motion.div>
        </div>

        {/* Main Actions */}
        {isSearching ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-6"
          >
            <pre className="text-cyan-400 font-mono text-sm animate-pulse mb-4">
{`
  ╔════════════════════════╗
  ║   SEARCHING FOR        ║
  ║      OPPONENT...       ║
  ╚════════════════════════╝
`}
            </pre>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto"
            />
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(0, 255, 255, 0.8)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleJoinQueue}
            className="w-full bg-black border-2 border-cyan-500 text-cyan-400 font-mono font-bold py-4 px-8 text-lg transition-all hover:bg-cyan-500/10 mb-4"
          >
            {'>'} START MATCH {'<'}
          </motion.button>
        )}

        {/* Navigation Buttons */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <motion.button
            whileHover={{ scale: 1.05, borderColor: '#22d3ee' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenModal(setShowLeaderboard)}
            className="bg-black/50 border border-gray-700 hover:border-cyan-500 text-gray-400 hover:text-cyan-400 font-mono py-3 px-2 text-sm transition-all"
          >
            [L] RANKS
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, borderColor: '#a855f7' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenModal(setShowSpectate)}
            className="bg-black/50 border border-gray-700 hover:border-purple-500 text-gray-400 hover:text-purple-400 font-mono py-3 px-2 text-sm transition-all"
          >
            [W] WATCH
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, borderColor: '#ec4899' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenModal(setShowTournaments)}
            className="bg-black/50 border border-gray-700 hover:border-pink-500 text-gray-400 hover:text-pink-400 font-mono py-3 px-2 text-sm transition-all"
          >
            [T] TOURNEY
          </motion.button>
        </div>

        {/* Retro Decorations */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-cyan-500 animate-pulse" />
        <div className="absolute top-2 right-2 w-2 h-2 bg-pink-500 animate-pulse" />
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-pink-500 animate-pulse" />
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-cyan-500 animate-pulse" />
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
        {showSpectate && <Spectate onClose={() => setShowSpectate(false)} />}
        {showTournaments && <TournamentBracket onClose={() => setShowTournaments(false)} playerName={playerName} />}
      </AnimatePresence>
    </div>
  );
};
