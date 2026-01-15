import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { HandSelection } from './HandSelection';
import { RetroBackground } from './RetroBackground';
import { AsciiDisplay, GlitchAscii } from './AsciiArt';
import type { GameState } from '@shared/types';

interface GameScreenProps {
  gameState: GameState;
  myId: string;
  opponentId: string;
  playerName: string;
  onPlayAgain: () => void;
  onQuit: () => void;
}

type Move = 'rock' | 'paper' | 'scissors' | null;

const getMoveEmoji = (move: Move) => {
  if (move === 'rock') return '✊';
  if (move === 'paper') return '✋';
  if (move === 'scissors') return '✌️';
  return '?';
};

export const GameScreen = ({ gameState, myId, opponentId, playerName, onPlayAgain, onQuit }: GameScreenProps) => {
  const { socket } = useSocket();
  const [myMove, setMyMove] = useState<Move>(null);
  const [revealedMyMove, setRevealedMyMove] = useState<Move>(null);
  const [revealedOpponentMove, setRevealedOpponentMove] = useState<Move>(null);
  const [roundResult, setRoundResult] = useState<{
    winnerId: string | null;
    moves: { p1: 'rock' | 'paper' | 'scissors'; p2: 'rock' | 'paper' | 'scissors' };
  } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  const myPlayer = gameState.players.find(p => p.id === myId);
  const opponentPlayer = gameState.players.find(p => p.id === opponentId);

  useEffect(() => {
    if (!socket) return;

    const handleRoundResult = (data: {
      winnerId: string | null;
      moves: { p1: 'rock' | 'paper' | 'scissors'; p2: 'rock' | 'paper' | 'scissors' };
    }) => {
      // p1 is always the first player in the players array
      const isPlayer1 = gameState.players[0].id === myId;
      const myMoveValue = isPlayer1 ? data.moves.p1 : data.moves.p2;
      const opponentMoveValue = isPlayer1 ? data.moves.p2 : data.moves.p1;
      
      // Start reveal animation
      setIsRevealing(true);
      
      // Reveal both moves simultaneously after countdown
      setTimeout(() => {
        setRevealedMyMove(myMoveValue);
        setRevealedOpponentMove(opponentMoveValue);
        setRoundResult(data);
        setShowResult(true);
        setIsRevealing(false);
      }, 1000);

      // Reset after showing result
      setTimeout(() => {
        setMyMove(null);
        setRevealedMyMove(null);
        setRevealedOpponentMove(null);
        setRoundResult(null);
        setShowResult(false);
      }, 5000);
    };

    socket.on('round_result', handleRoundResult);

    return () => {
      socket.off('round_result', handleRoundResult);
    };
  }, [socket, gameState.players, myId]);

  const handleMoveSelect = (move: 'rock' | 'paper' | 'scissors') => {
    if (myMove || !socket) return;
    
    setMyMove(move);
    socket.emit('submit_move', { move });
  };

  const isMyTurn = !myMove && !showResult && !isRevealing;
  const waitingForOpponent = myMove && !showResult && !isRevealing;

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <RetroBackground />
      {/* CRT Overlay */}
      <div className="fixed inset-0 pointer-events-none z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyIiBoZWlnaHQ9IjIiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4xKSIvPjwvc3ZnPg==')] opacity-30" />
      <div className="max-w-4xl mx-auto relative z-20">
        {/* Header with Quit Button */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center mb-4"
        >
          <pre className="text-cyan-400 font-mono text-xs">
{`╔═══════════════════╗
║  R.P.S. ARENA     ║
╚═══════════════════╝`}
          </pre>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onQuit}
            className="bg-black border-2 border-red-500/50 hover:border-red-500 text-red-400 font-mono py-2 px-4 transition-all"
          >
            [X] QUIT
          </motion.button>
        </motion.div>

        {/* Score Board */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-black/80 border-2 border-cyan-500/50 p-6 mb-6"
          style={{ boxShadow: '0 0 30px rgba(0,255,255,0.2), inset 0 0 20px rgba(0,255,255,0.05)' }}
        >
          <div className="flex justify-between items-center">
            <motion.div 
              className="text-center"
              animate={myPlayer?.score ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <p className="text-cyan-400 text-sm mb-1 font-mono">{playerName}</p>
              <p className="text-5xl font-bold text-cyan-400 font-mono drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]">
                {myPlayer?.score || 0}
              </p>
            </motion.div>
            <div className="flex flex-col items-center">
              <AsciiDisplay type="vs" color="text-yellow-400" size="sm" />
            </div>
            <motion.div 
              className="text-center"
              animate={opponentPlayer?.score ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <p className="text-magenta-400 text-sm mb-1 font-mono">
                {opponentId?.startsWith('bot_') ? '🤖 CPU' : opponentPlayer?.name || 'OPPONENT'}
              </p>
              <p className="text-5xl font-bold text-magenta-400 font-mono drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]">
                {opponentPlayer?.score || 0}
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Countdown/Reveal Animation */}
        <AnimatePresence>
          {isRevealing && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-center mb-6"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="text-7xl mb-2 drop-shadow-[0_0_30px_rgba(234,179,8,0.8)]"
              >
                🎯
              </motion.div>
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.3, repeat: Infinity }}
                className="text-2xl font-bold text-yellow-400"
              >
                Revealing...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* My Hand */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-gray-800/60 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-8 text-center shadow-lg shadow-cyan-500/10 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
            <h3 className="text-xl font-semibold text-cyan-400 mb-4 relative">{playerName}'s Hand</h3>
            <AnimatePresence mode="wait">
              {showResult && revealedMyMove ? (
                <motion.div
                  key={`revealed-${revealedMyMove}`}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  className="text-8xl relative drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]"
                >
                  {getMoveEmoji(revealedMyMove)}
                </motion.div>
              ) : myMove ? (
                <motion.div
                  key="locked"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center relative"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-6xl mb-2 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]"
                  >
                    🤜
                  </motion.div>
                  <span className="text-cyan-400 text-sm font-semibold bg-cyan-500/20 px-3 py-1 rounded-full">✓ Locked In</span>
                </motion.div>
              ) : (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-gray-500 text-6xl relative"
                >
                  ?
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Opponent Hand */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-gray-800/60 backdrop-blur-xl border border-magenta-500/30 rounded-xl p-8 text-center shadow-lg shadow-magenta-500/10 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-magenta-500/5 to-transparent" />
            <h3 className="text-xl font-semibold text-magenta-400 mb-4 relative">
              {opponentId?.startsWith('bot_') ? '🤖 Bot' : 'Opponent'}
            </h3>
            <AnimatePresence mode="wait">
              {showResult && revealedOpponentMove ? (
                <motion.div
                  key={`revealed-${revealedOpponentMove}`}
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -180 }}
                  className="text-8xl relative drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]"
                >
                  {getMoveEmoji(revealedOpponentMove)}
                </motion.div>
              ) : waitingForOpponent ? (
                <motion.div
                  key="opponent-locked"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center relative"
                >
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-6xl mb-2 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]"
                  >
                    🤛
                  </motion.div>
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-magenta-400 text-sm font-semibold bg-magenta-500/20 px-3 py-1 rounded-full"
                  >
                    Thinking...
                  </motion.span>
                </motion.div>
              ) : (
                <motion.div
                  key="hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="text-gray-500 text-6xl relative"
                >
                  ?
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Result Display */}
        <AnimatePresence>
          {showResult && roundResult && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-center mb-6"
            >
              {roundResult.winnerId === null ? (
                <motion.div
                  initial={{ y: 20 }}
                  animate={{ y: 0, scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5 }}
                  className="bg-yellow-500/20 border border-yellow-500/50 rounded-2xl p-6 inline-block"
                >
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: 3 }}
                    className="text-5xl block mb-2"
                  >
                    🤝
                  </motion.span>
                  <p className="text-3xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                    It's a Tie!
                  </p>
                </motion.div>
              ) : roundResult.winnerId === myId ? (
                <motion.div
                  initial={{ y: 20 }}
                  animate={{ y: 0, scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5 }}
                  className="bg-cyan-500/20 border border-cyan-500/50 rounded-2xl p-6 inline-block"
                >
                  <motion.span
                    animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: 3 }}
                    className="text-5xl block mb-2"
                  >
                    🎉
                  </motion.span>
                  <p className="text-3xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                    You Win!
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="bg-magenta-500/20 border border-magenta-500/50 rounded-2xl p-6 inline-block"
                >
                  <motion.span
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: 2 }}
                    className="text-5xl block mb-2"
                  >
                    😔
                  </motion.span>
                  <p className="text-3xl font-bold text-magenta-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                    You Lose
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hand Selection */}
        {isMyTurn && (
          <HandSelection onSelect={handleMoveSelect} />
        )}

        {/* Play Again Button - Show after result */}
        {showResult && roundResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setMyMove(null);
                setRevealedMyMove(null);
                setRevealedOpponentMove(null);
                setRoundResult(null);
                setShowResult(false);
                onPlayAgain();
              }}
              className="bg-gradient-to-r from-cyan-500 via-purple-500 to-magenta-500 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-cyan-500/30 transition-all relative overflow-hidden group"
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <span className="relative text-lg">🔄 Next Round</span>
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
