import { useState } from 'react';
import { motion } from 'framer-motion';
import { RetroBackground } from './RetroBackground';
import { AsciiDisplay } from './AsciiArt';

interface WelcomeProps {
  onSubmit: (name: string) => void;
}

export const Welcome = ({ onSubmit }: WelcomeProps) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <RetroBackground />
      
      {/* CRT Overlay */}
      <div className="fixed inset-0 pointer-events-none z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyIiBoZWlnaHQ9IjIiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4xKSIvPjwvc3ZnPg==')] opacity-30" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-20 bg-black/80 backdrop-blur-xl border-2 border-cyan-500/50 rounded-none p-8 shadow-[0_0_50px_rgba(0,255,255,0.3)] max-w-md w-full"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          {/* ASCII Art Title */}
          <div className="flex justify-center mb-6">
            <AsciiDisplay type="title" color="text-cyan-400" size="md" />
          </div>
          
          <pre className="text-cyan-500 font-mono text-xs mb-4 opacity-70">
{`╔═══════════════════════════════╗
║   RETRO ARCADE EDITION        ║
╚═══════════════════════════════╝`}
          </pre>
          
          <p className="text-gray-500 font-mono text-sm">ENTER YOUR CALLSIGN</p>
        </motion.div>

        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="ENTER NAME..."
              maxLength={15}
              className="w-full bg-black border-2 border-cyan-500/50 focus:border-cyan-400 px-4 py-3 text-cyan-400 placeholder-gray-600 outline-none transition-colors text-lg font-mono uppercase tracking-wider"
              autoFocus
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-black border-2 border-cyan-500 disabled:border-gray-700 text-cyan-400 disabled:text-gray-600 font-mono font-bold py-4 px-8 text-lg transition-all disabled:cursor-not-allowed hover:bg-cyan-500/10"
          >
            {'>'} INSERT COIN {'<'}
          </motion.button>
        </motion.form>
        
        {/* Retro corner decorations */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-cyan-500 animate-pulse" />
        <div className="absolute top-2 right-2 w-2 h-2 bg-magenta-500 animate-pulse" />
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-magenta-500 animate-pulse" />
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-cyan-500 animate-pulse" />
      </motion.div>
    </div>
  );
};
