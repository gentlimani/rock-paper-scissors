import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { HandSelection } from './HandSelection';
import { RetroBackground } from './RetroBackground';
import { AsciiDisplay } from './AsciiArt';
import sounds, { music } from '../utils/sounds';
import type { GameState } from '@shared/types';

interface GameScreenProps {
  gameState: GameState;
  myId: string;
  opponentId: string;
  playerName: string;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

type Move = 'rock' | 'paper' | 'scissors' | null;

const WINNING_SCORE = 2; // First to 2 wins

export const GameScreen = ({ gameState, myId, opponentId, playerName, onPlayAgain, onBackToLobby }: GameScreenProps) => {
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
  const [gameWinner, setGameWinner] = useState<'me' | 'opponent' | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(true);

  const myPlayer = gameState.players.find(p => p.id === myId);
  const opponentPlayer = gameState.players.find(p => p.id === opponentId);

  // Start/stop background music
  useEffect(() => {
    if (musicEnabled) {
      music.start();
    } else {
      music.stop();
    }
    
    // Cleanup on unmount
    return () => {
      music.stop();
    };
  }, [musicEnabled]);

  const toggleMusic = () => {
    setMusicEnabled(prev => !prev);
    sounds.click();
  };

  // Check for game winner
  useEffect(() => {
    const myScore = myPlayer?.score || 0;
    const oppScore = opponentPlayer?.score || 0;
    
    if (myScore >= WINNING_SCORE && !gameWinner) {
      setGameWinner('me');
      sounds.gameWin();
    } else if (oppScore >= WINNING_SCORE && !gameWinner) {
      setGameWinner('opponent');
      sounds.gameLose();
    }
  }, [myPlayer?.score, opponentPlayer?.score, gameWinner]);

  // Request leaderboard update after each round
  useEffect(() => {
    if (showResult && socket) {
      socket.emit('get_leaderboard');
    }
  }, [showResult, socket]);

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
      sounds.reveal();
      
      // Reveal both moves simultaneously after countdown
      setTimeout(() => {
        setRevealedMyMove(myMoveValue);
        setRevealedOpponentMove(opponentMoveValue);
        setRoundResult(data);
        setShowResult(true);
        setIsRevealing(false);
        
        // Play appropriate sound
        if (data.winnerId === null) {
          sounds.tie();
        } else if (data.winnerId === myId) {
          sounds.roundWin();
        } else {
          sounds.roundLose();
        }
      }, 1000);

      // Reset after showing result (only if no game winner)
      setTimeout(() => {
        if (!gameWinner) {
          setMyMove(null);
          setRevealedMyMove(null);
          setRevealedOpponentMove(null);
          setRoundResult(null);
          setShowResult(false);
        }
      }, 3000);
    };

    socket.on('round_result', handleRoundResult);

    return () => {
      socket.off('round_result', handleRoundResult);
    };
  }, [socket, gameState.players, myId, gameWinner]);

  const handleMoveSelect = (move: 'rock' | 'paper' | 'scissors') => {
    if (myMove || !socket || gameWinner) return;
    
    sounds.select();
    setMyMove(move);
    socket.emit('submit_move', { move });
  };

  const handleNewGame = () => {
    setMyMove(null);
    setRevealedMyMove(null);
    setRevealedOpponentMove(null);
    setRoundResult(null);
    setShowResult(false);
    setGameWinner(null);
    sounds.click();
    onPlayAgain();
  };

  const isMyTurn = !myMove && !showResult && !isRevealing && !gameWinner;
  const waitingForOpponent = myMove && !showResult && !isRevealing;

  // Game Over Screen
  if (gameWinner) {
    return (
      <div className="min-h-screen p-4 relative overflow-hidden">
        <RetroBackground />
        <div className="fixed inset-0 pointer-events-none z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyIiBoZWlnaHQ9IjIiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4xKSIvPjwvc3ZnPg==')] opacity-30" />
        {/* Music Toggle on Game Over */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleMusic}
          className={`fixed top-4 right-4 z-30 bg-black border-2 font-mono py-2 px-4 transition-all ${
            musicEnabled 
              ? 'border-green-500/50 hover:border-green-500 text-green-400' 
              : 'border-gray-500/50 hover:border-gray-500 text-gray-400'
          }`}
        >
          {musicEnabled ? '♪ ON' : '♪ OFF'}
        </motion.button>
        <div className="max-w-4xl mx-auto relative z-20 flex flex-col items-center justify-center min-h-screen">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            {gameWinner === 'me' ? (
              <>
                <motion.pre
                  initial={{ y: -50 }}
                  animate={{ y: 0 }}
                  className="text-cyan-400 font-mono text-xs md:text-sm mb-8"
                >
{`
╔════════════════════════════════════════╗
║                                        ║
║     ██╗   ██╗██╗ ██████╗████████╗      ║
║     ██║   ██║██║██╔════╝╚══██╔══╝      ║
║     ██║   ██║██║██║        ██║         ║
║     ╚██╗ ██╔╝██║██║        ██║         ║
║      ╚████╔╝ ██║╚██████╗   ██║         ║
║       ╚═══╝  ╚═╝ ╚═════╝   ╚═╝         ║
║                                        ║
╚════════════════════════════════════════╝
`}
                </motion.pre>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  <AsciiDisplay type="win" color="text-cyan-400" size="lg" />
                </motion.div>
                <p className="text-cyan-400 font-mono text-2xl mb-2">CONGRATULATIONS!</p>
                <p className="text-gray-400 font-mono">Final Score: {myPlayer?.score} - {opponentPlayer?.score}</p>
              </>
            ) : (
              <>
                <motion.pre
                  initial={{ y: -50 }}
                  animate={{ y: 0 }}
                  className="text-red-400 font-mono text-xs md:text-sm mb-8"
                >
{`
╔════════════════════════════════════════╗
║                                        ║
║     ██████╗ ███████╗███████╗███████╗   ║
║     ██╔══██╗██╔════╝██╔════╝██╔════╝   ║
║     ██║  ██║█████╗  █████╗  █████╗     ║
║     ██║  ██║██╔══╝  ██╔══╝  ██╔══╝     ║
║     ██████╔╝███████╗██║     ███████╗   ║
║     ╚═════╝ ╚══════╝╚═╝     ╚══════╝   ║
║                                        ║
╚════════════════════════════════════════╝
`}
                </motion.pre>
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AsciiDisplay type="lose" color="text-red-400" size="lg" />
                </motion.div>
                <p className="text-red-400 font-mono text-2xl mb-2 mt-4">GAME OVER</p>
                <p className="text-gray-400 font-mono">Final Score: {myPlayer?.score} - {opponentPlayer?.score}</p>
              </>
            )}
            
            <div className="flex gap-4 justify-center mt-8">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewGame}
                className="bg-black border-2 border-cyan-500 text-cyan-400 font-mono py-3 px-8 transition-all"
              >
                [R] REMATCH
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(156, 163, 175, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { sounds.click(); onBackToLobby(); }}
                className="bg-black border-2 border-gray-500/50 hover:border-gray-500 text-gray-400 font-mono py-3 px-8 transition-all"
              >
                [B] BACK
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <RetroBackground />
      {/* CRT Overlay */}
      <div className="fixed inset-0 pointer-events-none z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyIiBoZWlnaHQ9IjIiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4xKSIvPjwvc3ZnPg==')] opacity-30" />
      <div className="max-w-4xl mx-auto relative z-20">
        {/* Header with Music and Quit Buttons */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center mb-4"
        >
          <pre className="text-cyan-400 font-mono text-xs">
{`╔═══════════════════════════╗
║  R.P.S. ARENA  [Best of 3] ║
╚═══════════════════════════╝`}
          </pre>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: musicEnabled ? '0 0 15px rgba(34, 197, 94, 0.5)' : '0 0 15px rgba(156, 163, 175, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMusic}
              className={`bg-black border-2 font-mono py-2 px-4 transition-all ${
                musicEnabled 
                  ? 'border-green-500/50 hover:border-green-500 text-green-400' 
                  : 'border-gray-500/50 hover:border-gray-500 text-gray-400'
              }`}
            >
              {musicEnabled ? '♪ ON' : '♪ OFF'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(156, 163, 175, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { sounds.click(); onBackToLobby(); }}
              className="bg-black border-2 border-gray-500/50 hover:border-gray-500 text-gray-400 font-mono py-2 px-4 transition-all"
            >
              [B] BACK
            </motion.button>
          </div>
        </motion.div>

        {/* Score Board */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/90 border-2 border-cyan-500/50 p-6 mb-6"
          style={{ boxShadow: '0 0 30px rgba(0,255,255,0.2), inset 0 0 20px rgba(0,255,255,0.05)' }}
        >
          <div className="flex justify-between items-center">
            <motion.div 
              className="text-center"
              animate={myPlayer?.score ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <p className="text-cyan-300 text-sm mb-1 font-mono font-bold">{playerName}</p>
              <p className="text-5xl font-bold text-cyan-400 font-mono drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]">
                {myPlayer?.score || 0}
              </p>
              <p className="text-cyan-500 text-xs font-mono mt-1">FIRST TO {WINNING_SCORE}</p>
            </motion.div>
            <div className="flex flex-col items-center">
              <AsciiDisplay type="vs" color="text-yellow-400" size="sm" />
            </div>
            <motion.div 
              className="text-center"
              animate={opponentPlayer?.score ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <p className="text-pink-300 text-sm mb-1 font-mono font-bold">
                {opponentId?.startsWith('bot_') ? 'CPU' : opponentPlayer?.name || 'OPPONENT'}
              </p>
              <p className="text-5xl font-bold text-pink-400 font-mono drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]">
                {opponentPlayer?.score || 0}
              </p>
              <p className="text-pink-500 text-xs font-mono mt-1">FIRST TO {WINNING_SCORE}</p>
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
              <motion.pre
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3, repeat: 3 }}
                className="text-yellow-400 font-mono text-lg"
              >
{`
  ╔═══════════════╗
  ║  REVEALING... ║
  ╚═══════════════╝
`}
              </motion.pre>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* My Hand */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-gray-900/90 border-2 border-cyan-500/30 p-6 text-center relative overflow-hidden"
            style={{ boxShadow: '0 0 20px rgba(0,255,255,0.2)' }}
          >
            <h3 className="text-lg font-bold text-cyan-400 mb-4 font-mono">[{playerName}]</h3>
            <div className="min-h-[120px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {showResult && revealedMyMove ? (
                  <motion.div
                    key={`revealed-${revealedMyMove}`}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                  >
                    <AsciiDisplay type={revealedMyMove} color="text-cyan-400" size="md" />
                  </motion.div>
                ) : myMove ? (
                  <motion.div
                    key="locked"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center"
                  >
                    <motion.pre
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="text-green-400 font-mono text-xs"
                    >
{`
  ╔══════════════╗
  ║  LOCKED IN!  ║
  ╚══════════════╝
`}
                    </motion.pre>
                  </motion.div>
                ) : (
                  <motion.pre
                    key="waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-gray-400 font-mono text-lg"
                  >
                    {'[ ? ]'}
                  </motion.pre>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Opponent Hand */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-gray-900/90 border-2 border-pink-500/30 p-6 text-center relative overflow-hidden"
            style={{ boxShadow: '0 0 20px rgba(236,72,153,0.2)' }}
          >
            <h3 className="text-lg font-bold text-pink-400 mb-4 font-mono">
              [{opponentId?.startsWith('bot_') ? 'CPU' : opponentPlayer?.name || 'OPPONENT'}]
            </h3>
            <div className="min-h-[120px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {showResult && revealedOpponentMove ? (
                  <motion.div
                    key={`revealed-${revealedOpponentMove}`}
                    initial={{ scale: 0, rotate: 180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -180 }}
                  >
                    <AsciiDisplay type={revealedOpponentMove} color="text-pink-400" size="md" />
                  </motion.div>
                ) : waitingForOpponent ? (
                  <motion.div
                    key="opponent-thinking"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center"
                  >
                    <motion.pre
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-pink-400 font-mono text-xs"
                    >
{`
  ╔══════════════╗
  ║  THINKING... ║
  ╚══════════════╝
`}
                    </motion.pre>
                  </motion.div>
                ) : (
                  <motion.pre
                    key="hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="text-gray-400 font-mono text-lg"
                  >
                    {'[ ? ]'}
                  </motion.pre>
                )}
              </AnimatePresence>
            </div>
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
                  animate={{ y: 0 }}
                  className="inline-block"
                >
                  <AsciiDisplay type="tie" color="text-yellow-400" size="md" />
                </motion.div>
              ) : roundResult.winnerId === myId ? (
                <motion.div
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="inline-block"
                >
                  <pre className="text-cyan-400 font-mono text-sm">
{`
  ╔═══════════════════╗
  ║   ROUND  WIN!     ║
  ╚═══════════════════╝
`}
                  </pre>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="inline-block"
                >
                  <pre className="text-red-400 font-mono text-sm">
{`
  ╔═══════════════════╗
  ║   ROUND  LOST     ║
  ╚═══════════════════╝
`}
                  </pre>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hand Selection */}
        {isMyTurn && (
          <HandSelection onSelect={handleMoveSelect} />
        )}

        {/* Next Round - auto continues */}
        {showResult && roundResult && !gameWinner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-4"
          >
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-gray-500 font-mono text-sm"
            >
              {'> NEXT ROUND STARTING... <'}
            </motion.p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
