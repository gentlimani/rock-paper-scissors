import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import type { Tournament, TournamentMatch } from '@shared/types';

interface TournamentBracketProps {
  onClose: () => void;
  playerName: string;
}

export const TournamentBracket = ({ onClose, playerName }: TournamentBracketProps) => {
  const { socket } = useSocket();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTournamentName, setNewTournamentName] = useState('');
  const [newTournamentSize, setNewTournamentSize] = useState(8);

  useEffect(() => {
    if (!socket) return;

    socket.emit('get_tournaments');

    const handleTournaments = (data: Tournament[]) => {
      setTournaments(data);
      setLoading(false);
      
      // Update selected tournament if viewing one
      if (selectedTournament) {
        const updated = data.find(t => t.id === selectedTournament.id);
        if (updated) setSelectedTournament(updated);
      }
    };

    const handleTournamentUpdate = (data: Tournament) => {
      setTournaments(prev => prev.map(t => t.id === data.id ? data : t));
      if (selectedTournament?.id === data.id) {
        setSelectedTournament(data);
      }
    };

    socket.on('tournaments_list', handleTournaments);
    socket.on('tournament_update', handleTournamentUpdate);

    return () => {
      socket.off('tournaments_list', handleTournaments);
      socket.off('tournament_update', handleTournamentUpdate);
    };
  }, [socket, selectedTournament]);

  const createTournament = () => {
    if (!socket || !newTournamentName.trim()) return;
    
    socket.emit('create_tournament', {
      name: newTournamentName.trim(),
      maxPlayers: newTournamentSize,
    });
    
    setNewTournamentName('');
    setCreating(false);
  };

  const joinTournament = (tournamentId: string) => {
    if (!socket) return;
    socket.emit('join_tournament', { tournamentId });
  };

  const leaveTournament = (tournamentId: string) => {
    if (!socket) return;
    socket.emit('leave_tournament', { tournamentId });
  };

  const isPlayerInTournament = (tournament: Tournament) => {
    return tournament.players.some(p => p.name === playerName);
  };

  const renderBracket = (tournament: Tournament) => {
    const rounds: TournamentMatch[][] = [];
    const maxRound = Math.max(...tournament.matches.map(m => m.round));
    
    for (let r = 1; r <= maxRound; r++) {
      rounds.push(tournament.matches.filter(m => m.round === r));
    }

    return (
      <div className="overflow-x-auto">
        <div className="flex gap-8 min-w-max p-4">
          {rounds.map((roundMatches, roundIndex) => (
            <div key={roundIndex} className="flex flex-col justify-around gap-4">
              <h4 className="text-center text-gray-400 text-sm mb-2">
                {roundIndex === rounds.length - 1 ? 'Final' : 
                 roundIndex === rounds.length - 2 ? 'Semi-Final' : 
                 `Round ${roundIndex + 1}`}
              </h4>
              {roundMatches.map((match) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-gray-800/50 border rounded-lg p-3 w-48 ${
                    match.status === 'in_progress' ? 'border-yellow-500' :
                    match.status === 'completed' ? 'border-green-500/50' :
                    'border-gray-700'
                  }`}
                >
                  {/* Player 1 */}
                  <div className={`p-2 rounded ${
                    match.winner?.id === match.player1?.id ? 'bg-green-500/20 text-green-400' :
                    match.winner && match.winner.id !== match.player1?.id ? 'text-gray-500 line-through' :
                    'text-white'
                  }`}>
                    {match.player1?.name || '---'}
                  </div>
                  
                  <div className="text-center text-gray-500 text-xs my-1">vs</div>
                  
                  {/* Player 2 */}
                  <div className={`p-2 rounded ${
                    match.winner?.id === match.player2?.id ? 'bg-green-500/20 text-green-400' :
                    match.winner && match.winner.id !== match.player2?.id ? 'text-gray-500 line-through' :
                    'text-white'
                  }`}>
                    {match.player2?.name || '---'}
                  </div>

                  {match.status === 'in_progress' && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-center text-yellow-400 text-xs mt-2"
                    >
                      ⚔️ In Progress
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          ))}

          {/* Winner Display */}
          {tournament.winner && (
            <div className="flex flex-col justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500 rounded-lg p-6 text-center"
              >
                <span className="text-4xl block mb-2">🏆</span>
                <h4 className="text-yellow-400 font-bold">Winner</h4>
                <p className="text-white text-lg mt-2">{tournament.winner.name}</p>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (selectedTournament) {
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
          className="bg-gray-900/95 border border-cyan-500/30 rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">{selectedTournament.name}</h2>
              <p className="text-gray-400">
                {selectedTournament.players.length}/{selectedTournament.maxPlayers} players •{' '}
                <span className={
                  selectedTournament.status === 'waiting' ? 'text-yellow-400' :
                  selectedTournament.status === 'in_progress' ? 'text-green-400' :
                  'text-gray-400'
                }>
                  {selectedTournament.status === 'waiting' ? '⏳ Waiting for players' :
                   selectedTournament.status === 'in_progress' ? '🎮 In Progress' :
                   '✅ Completed'}
                </span>
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedTournament(null)}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-white"
            >
              ← Back
            </motion.button>
          </div>

          {/* Bracket or Waiting Room */}
          {selectedTournament.status === 'waiting' ? (
            <div className="text-center py-8">
              <h3 className="text-xl text-white mb-4">Waiting Room</h3>
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {selectedTournament.players.map((player, i) => (
                  <motion.div
                    key={player.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
                  >
                    <span className="text-gray-500 mr-2">#{player.seed}</span>
                    <span className={player.name === playerName ? 'text-cyan-400' : 'text-white'}>
                      {player.name}
                    </span>
                  </motion.div>
                ))}
                {Array.from({ length: selectedTournament.maxPlayers - selectedTournament.players.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-gray-800/30 border border-dashed border-gray-700 rounded-lg px-4 py-2 text-gray-600">
                    Waiting...
                  </div>
                ))}
              </div>
              
              {!isPlayerInTournament(selectedTournament) ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => joinTournament(selectedTournament.id)}
                  className="bg-gradient-to-r from-cyan-500 to-magenta-500 text-white font-bold py-3 px-8 rounded-xl"
                >
                  Join Tournament
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => leaveTournament(selectedTournament.id)}
                  className="bg-red-500/20 border border-red-500 text-red-400 font-bold py-3 px-8 rounded-xl"
                >
                  Leave Tournament
                </motion.button>
              )}
            </div>
          ) : (
            renderBracket(selectedTournament)
          )}
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
            🏟️ Tournaments
          </h2>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCreating(true)}
              className="bg-cyan-500/20 border border-cyan-500 text-cyan-400 px-4 py-2 rounded-lg text-sm font-medium"
            >
              + Create
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </motion.button>
          </div>
        </div>

        {/* Create Tournament Form */}
        <AnimatePresence>
          {creating && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <h3 className="text-white font-medium mb-3">Create New Tournament</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newTournamentName}
                    onChange={(e) => setNewTournamentName(e.target.value)}
                    placeholder="Tournament name..."
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-cyan-500"
                  />
                  <select
                    value={newTournamentSize}
                    onChange={(e) => setNewTournamentSize(Number(e.target.value))}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                  >
                    <option value={4}>4 players</option>
                    <option value={8}>8 players</option>
                    <option value={16}>16 players</option>
                  </select>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={createTournament}
                    disabled={!newTournamentName.trim()}
                    className="bg-cyan-500 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Create
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tournament List */}
        <div className="overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="text-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-gray-400">Loading tournaments...</p>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-6xl block mb-4">🏟️</span>
              <p className="text-gray-400 text-lg">No tournaments yet</p>
              <p className="text-gray-500 text-sm mt-2">Create one to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tournaments.map((tournament) => (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedTournament(tournament)}
                  className="bg-gray-800/50 border border-gray-700 hover:border-cyan-500/50 rounded-xl p-4 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-medium">{tournament.name}</h3>
                      <p className="text-gray-500 text-sm">
                        {tournament.players.length}/{tournament.maxPlayers} players
                        {isPlayerInTournament(tournament) && (
                          <span className="text-cyan-400 ml-2">• You're in!</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm px-3 py-1 rounded-full ${
                        tournament.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                        tournament.status === 'in_progress' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {tournament.status === 'waiting' ? 'Open' :
                         tournament.status === 'in_progress' ? 'Live' :
                         'Finished'}
                      </span>
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
