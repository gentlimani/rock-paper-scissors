import { useSocket } from './context/SocketContext';
import { Welcome } from './components/Welcome';
import { Lobby } from './components/Lobby';
import { GameScreen } from './components/GameScreen';
import { RetroBackground } from './components/RetroBackground';

function App() {
  const { socket, isConnected, gameState, opponentId, isSearching, playerName, setPlayerName, joinQueue, playAgain, quitGame } = useSocket();

  if (!isConnected || !socket) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center relative overflow-hidden">
        <RetroBackground />
        <div className="text-center relative z-10">
          <pre className="text-cyan-400 font-mono text-xs mb-6 animate-pulse">
{`
╔══════════════════════════╗
║      INITIALIZING...     ║
╚══════════════════════════╝
`}
          </pre>
          <div className="w-16 h-16 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
          <p className="text-cyan-500 font-mono">CONNECTING TO SERVER...</p>
        </div>
      </div>
    );
  }

  // Show welcome screen if no name entered yet
  if (!playerName) {
    return <Welcome onSubmit={setPlayerName} />;
  }

  if (gameState && opponentId && socket.id) {
    return (
      <GameScreen
        gameState={gameState}
        myId={socket.id}
        opponentId={opponentId}
        playerName={playerName}
        onPlayAgain={playAgain}
        onQuit={quitGame}
      />
    );
  }

  return <Lobby onJoinQueue={joinQueue} isSearching={isSearching} playerName={playerName} />;
}

export default App;
