import { motion } from 'framer-motion';
import { AsciiDisplay } from './AsciiArt';

interface HandSelectionProps {
  onSelect: (move: 'rock' | 'paper' | 'scissors') => void;
}

const hands = [
  { move: 'rock' as const, label: 'ROCK', key: '[A]' },
  { move: 'paper' as const, label: 'PAPER', key: '[S]' },
  { move: 'scissors' as const, label: 'SCISSORS', key: '[D]' },
];

export const HandSelection = ({ onSelect }: HandSelectionProps) => {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-black/80 border-2 border-cyan-500/50 p-6"
      style={{ boxShadow: '0 0 30px rgba(0,255,255,0.2)' }}
    >
      <pre className="text-cyan-400 font-mono text-center text-xs mb-6">
{`╔═══════════════════════════════╗
║     SELECT YOUR WEAPON        ║
╚═══════════════════════════════╝`}
      </pre>
      <div className="flex justify-center gap-4">
        {hands.map((hand, index) => (
          <motion.button
            key={hand.move}
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: index * 0.15, type: 'spring', stiffness: 200 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 0 40px rgba(0, 255, 255, 0.6)'
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(hand.move)}
            className="bg-black border-2 border-gray-700 hover:border-cyan-500 p-4 transition-all cursor-pointer group"
          >
            <div className="mb-2">
              <AsciiDisplay type={hand.move} color="text-cyan-400 group-hover:text-cyan-300" size="sm" />
            </div>
            <div className="text-center">
              <span className="text-gray-500 font-mono text-xs">{hand.key}</span>
              <p className="text-cyan-400 font-mono text-sm group-hover:text-cyan-300">
                {hand.label}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-center text-cyan-500/50 font-mono text-xs mt-4"
      >
        {'>'} CLICK TO LOCK IN {'<'}
      </motion.p>
    </motion.div>
  );
};
