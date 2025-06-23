import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';

const GamePage = () => {
  const { gameId } = useParams();
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [restartKey, setRestartKey] = useState(0);
  const canvasRef = useRef(null);
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const gameStateRef = useRef({
    ball: { x: 0, y: 0, dx: 0, dy: 0, radius: 10 },
    player1: { x: 0, y: 0, width: 15, height: 100, speed: 8, upKey: false, downKey: false },
    player2: { x: 0, y: 0, width: 15, height: 100, speed: 8, upKey: false, downKey: false },
    canvasWidth: 800,
    canvasHeight: 600,
  });

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const response = await api.get(`/game-rooms/${gameId}/`);
        setGameData(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load game data');
      } finally {
        setLoading(false);
      }
    };

    if (gameId) fetchGameData();
  }, [gameId]);

  useEffect(() => {
    const updateStats = async () => {
      if (!winner || !gameData) return;

      try {
        const winnerName = winner === 1 ? gameData.player1_intra_id : gameData.player2_intra_id;
        const loserName = winner === 1 ? gameData.player2_intra_id : gameData.player1_intra_id;
        
        await api.post('/update-stats/', {
          winner_name: winnerName,
          loser_name: loserName
        });
      } catch (error) {
        console.error('Error updating stats:', error);
      }
    };

    updateStats();
  }, [winner, gameData]); 

  const initGame = () => {
    const state = gameStateRef.current;
    const canvas = canvasRef.current;

    canvas.width = state.canvasWidth;
    canvas.height = state.canvasHeight;

    state.ball.x = canvas.width / 2;
    state.ball.y = canvas.height / 2;
    state.ball.dx = 5 * (Math.random() > 0.5 ? 1 : -1);
    state.ball.dy = 5 * (Math.random() > 0.5 ? 1 : -1);

    state.player1.x = 20;
    state.player1.y = canvas.height / 2 - state.player1.height / 2;

    state.player2.x = canvas.width - 20 - state.player2.width;
    state.player2.y = canvas.height / 2 - state.player2.height / 2;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const state = gameStateRef.current;
      switch (e.key.toLowerCase()) {
        case 'w':
          state.player1.upKey = true;
          break;
        case 's':
          state.player1.downKey = true;
          break;
        case 'o':
          state.player2.upKey = true;
          break;
        case 'l':
          state.player2.downKey = true;
          break;
      }
    };

    const handleKeyUp = (e) => {
      const state = gameStateRef.current;
      switch (e.key.toLowerCase()) {
        case 'w':
          state.player1.upKey = false;
          break;
        case 's':
          state.player1.downKey = false;
          break;
        case 'o':
          state.player2.upKey = false;
          break;
        case 'l':
          state.player2.downKey = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!gameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = gameStateRef.current;

    initGame();

    const gameLoop = setInterval(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (state.player1.upKey && state.player1.y > 0) state.player1.y -= state.player1.speed;
      if (state.player1.downKey && state.player1.y < canvas.height - state.player1.height) state.player1.y += state.player1.speed;
      if (state.player2.upKey && state.player2.y > 0) state.player2.y -= state.player2.speed;
      if (state.player2.downKey && state.player2.y < canvas.height - state.player2.height) state.player2.y += state.player2.speed;

      state.ball.x += state.ball.dx;
      state.ball.y += state.ball.dy;

      if (state.ball.y - state.ball.radius < 0 || state.ball.y + state.ball.radius > canvas.height) {
        state.ball.dy = -state.ball.dy;
      }

      if (
        (state.ball.x - state.ball.radius < state.player1.x + state.player1.width &&
         state.ball.y > state.player1.y &&
         state.ball.y < state.player1.y + state.player1.height) ||
        (state.ball.x + state.ball.radius > state.player2.x &&
         state.ball.y > state.player2.y &&
         state.ball.y < state.player2.y + state.player2.height)
      ) {
        state.ball.dx = -state.ball.dx * 1.05;
        state.ball.dy += (Math.random() - 0.5) * 2;
      }

      if (state.ball.x - state.ball.radius < 0) {
        setScore(prev => {
          const newScore = { ...prev, player2: prev.player2 + 1 };
          if (newScore.player2 >= 5) {
            setWinner(2);
            setGameStarted(false);
          }
          return newScore;
        });
        initGame();
      }

      if (state.ball.x + state.ball.radius > canvas.width) {
        setScore(prev => {
          const newScore = { ...prev, player1: prev.player1 + 1 };
          if (newScore.player1 >= 5) {
            setWinner(1);
            setGameStarted(false);
          }
          return newScore;
        });
        initGame();
      }

      drawGame(ctx, state);
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameStarted]);

  const drawGame = (ctx, state) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

    ctx.strokeStyle = 'white';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(state.canvasWidth / 2, 0);
    ctx.lineTo(state.canvasWidth / 2, state.canvasHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'white';
    ctx.fillRect(state.player1.x, state.player1.y, state.player1.width, state.player1.height);
    ctx.fillRect(state.player2.x, state.player2.y, state.player2.width, state.player2.height);

    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '30px Arial';
    ctx.fillStyle = 'white';
    //ctx.fillText(`P1: ${score.player1}`, 50, 50);
    //ctx.fillText(`P2: ${score.player2}`, state.canvasWidth - 150, 50);
  };

  const handleRestart = () => {
    setWinner(null);
    setScore({ player1: 0, player2: 0 });
    setGameStarted(true);
    setRestartKey(prev => prev + 1);
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-xl">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-xl text-red-600">Error: {error}</div>;

  const player1 = {
    name: gameData?.player1_intra_id || 'Player 1',
    avatar: gameData?.player1_avatar || 'default-avatar.jpg',
  };
  const player2 = {
    name: gameData?.player2_intra_id || 'Player 2',
    avatar: gameData?.player2_avatar || 'default-avatar.jpg',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray text-black">
      {!gameStarted && !winner ? (
        <>
          <h2 className="text-3xl font-bold mb-6">1v1 Match</h2>
          <div className="flex items-center space-x-12 mb-8">
            <div className="text-center">
              <img src={player1.avatar} alt={player1.name} className="w-24 h-24 rounded-full mx-auto mb-2" />
              <h3 className="text-lg">{player1.name}</h3>
            </div>
            <div className="text-2xl font-bold">VS</div>
            <div className="text-center">
              <img src={player2.avatar} alt={player2.name} className="w-24 h-24 rounded-full mx-auto mb-2" />
              <h3 className="text-lg">{player2.name}</h3>
            </div>
          </div>
          <button onClick={() => setGameStarted(true)} className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition">
            Start Game
          </button>
        </>
      ) : winner ? (
        <div className="flex flex-col items-center space-y-6">
          <h2 className="text-5xl font-bold text-green-400">🏆 {winner === 1 ? player1.name : player2.name} Wins! 🏆</h2>
          <img src={winner === 1 ? player1.avatar : player2.avatar} alt="Winner Avatar" className="w-24 h-24 rounded-full" />
          <button onClick={handleRestart} className="px-6 py-3 bg-green-500 rounded-lg hover:bg-green-600 transition">
            Play Again
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <canvas ref={canvasRef} key={restartKey} className="border-8 border-blue-900 rounded-lg"></canvas>
          <div className="flex justify-between w-full mt-4 max-w-2x2 text-lg font-bold">
            <div>{player1.name}: {score.player1}</div>
            <div>{player2.name}: {score.player2}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;