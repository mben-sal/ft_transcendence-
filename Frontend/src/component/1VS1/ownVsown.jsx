import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

const getRandomAvatar = () => {
  const id = Math.floor(Math.random() * 1000);
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`;
};

const OneVsOneMatch = () => {
  const { gameId } = useParams();
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [player1, setPlayer1] = useState({
    alias: '',
    image: getRandomAvatar(),
  });
  const [player2, setPlayer2] = useState({
    alias: '',
    image: getRandomAvatar(),
  });
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const canvasRef = useRef(null);
  const gameStateRef = useRef({
    ball: { x: 0, y: 0, dx: 0, dy: 0, radius: 10 },
    player1: { x: 0, y: 0, width: 15, height: 100, speed: 8, upKey: false, downKey: false },
    player2: { x: 0, y: 0, width: 15, height: 100, speed: 8, upKey: false, downKey: false },
    canvasWidth: 800,
    canvasHeight: 600,
  });

  const hasDuplicateAlias = () =>
    player1.alias.trim() !== '' &&
    player1.alias.trim().toLowerCase() === player2.alias.trim().toLowerCase();

  const isFormValid = () =>
    player1.alias.trim() !== '' &&
    player2.alias.trim() !== '' &&
    !hasDuplicateAlias();

  const handleStartGame = () => {
    if (hasDuplicateAlias()) {
      alert('Player names must be different.');
    } else if (!isFormValid()) {
      alert('Please enter both player names.');
    } else {
      setGameStarted(true);
    }
  };

  const handleGameEnd = (winnerIndex) => {
    setWinner(winnerIndex === 1 ? player1 : player2);
  };

  const regenerateImage = (playerSetter) => {
    playerSetter((prev) => ({ ...prev, image: getRandomAvatar() }));
  };

  const resetGame = () => {
    setPlayer1({ alias: '', image: getRandomAvatar() });
    setPlayer2({ alias: '', image: getRandomAvatar() });
    setGameStarted(false);
    setWinner(null);
    setScore({ player1: 0, player2: 0 });
  };

  // Initialize game
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

  // Handle key events
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

  // Game loop
  useEffect(() => {
    if (!gameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = gameStateRef.current;

    initGame();

    const gameLoop = setInterval(() => {
      // Check if the game has ended and stop the loop
      if (!gameStarted) {
        clearInterval(gameLoop);
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update player positions
      if (state.player1.upKey && state.player1.y > 0) {
        state.player1.y -= state.player1.speed;
      }
      if (state.player1.downKey && state.player1.y < canvas.height - state.player1.height) {
        state.player1.y += state.player1.speed;
      }

      if (state.player2.upKey && state.player2.y > 0) {
        state.player2.y -= state.player2.speed;
      }
      if (state.player2.downKey && state.player2.y < canvas.height - state.player2.height) {
        state.player2.y += state.player2.speed;
      }

      // Update ball position
      state.ball.x += state.ball.dx;
      state.ball.y += state.ball.dy;

      // Ball collision with top and bottom walls
      if (state.ball.y - state.ball.radius < 0 || state.ball.y + state.ball.radius > canvas.height) {
        state.ball.dy = -state.ball.dy;
      }

      // Ball collision with paddles
      // Player 1 (left paddle)
      if (
        state.ball.x - state.ball.radius < state.player1.x + state.player1.width &&
        state.ball.y > state.player1.y &&
        state.ball.y < state.player1.y + state.player1.height
      ) {
        state.ball.dx = -state.ball.dx * 1.05;
        const hitPosition = (state.ball.y - (state.player1.y + state.player1.height / 2)) / (state.player1.height / 2);
        state.ball.dy = hitPosition * 5;
      }

      // Player 2 (right paddle)
      if (
        state.ball.x + state.ball.radius > state.player2.x &&
        state.ball.y > state.player2.y &&
        state.ball.y < state.player2.y + state.player2.height
      ) {
        state.ball.dx = -state.ball.dx * 1.05;
        const hitPosition = (state.ball.y - (state.player2.y + state.player2.height / 2)) / (state.player2.height / 2);
        state.ball.dy = hitPosition * 5;
      }

      // Ball out of bounds (score)
      if (state.ball.x - state.ball.radius < 0) {
        // Player 2 scores
        setScore((prev) => {
          const newScore = { ...prev, player2: prev.player2 + 1 };
          if (newScore.player2 >= 5) {
            handleGameEnd(2);
            setGameStarted(false);
          }
          return newScore;
        });
        resetBall();
      } else if (state.ball.x + state.ball.radius > canvas.width) {
        // Player 1 scores
        setScore((prev) => {
          const newScore = { ...prev, player1: prev.player1 + 1 };
          if (newScore.player1 >= 5) {
            handleGameEnd(1);
            setGameStarted(false);
          }
          return newScore;
        });
        resetBall();
      }

      // Draw elements
      drawGame(ctx, state);
    }, 1000 / 60);

    const resetBall = () => {
      const state = gameStateRef.current;
      state.ball.x = canvas.width / 2;
      state.ball.y = canvas.height / 2;
      state.ball.dx = 5 * (Math.random() > 0.5 ? 1 : -1);
      state.ball.dy = 5 * (Math.random() > 0.5 ? 1 : -1);
    };

    const drawGame = (ctx, state) => {
      // Draw background
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

      // Draw center line
      ctx.strokeStyle = 'white';
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(state.canvasWidth / 2, 0);
      ctx.lineTo(state.canvasWidth / 2, state.canvasHeight);
      ctx.stroke();

      // Draw paddles
      ctx.fillStyle = 'white';
      ctx.fillRect(state.player1.x, state.player1.y, state.player1.width, state.player1.height);
      ctx.fillRect(state.player2.x, state.player2.y, state.player2.width, state.player2.height);

      // Draw ball
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    };

    return () => clearInterval(gameLoop);
  }, [gameStarted]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen  text-blue-500 p-4">
      <h1 className="text-3xl font-bold mb-6">PingPong</h1>
      {!gameStarted && !winner && (
        <div className="flex justify-center mb-6 w-full">
        <div className="text-center w-1/3">
          <h2 className="text-xl mb-2">Player 1</h2>
          <img
            src={player1.image}
            alt="Player 1 Avatar"
            className="w-24 h-24 mx-auto rounded-full mb-4"
          />
          <div className="flex flex-col items-center">
            <input
              type="text"
              value={player1.alias}
              onChange={(e) => setPlayer1({ ...player1, alias: e.target.value })}
              placeholder="Enter Player 1 Name"
              className="w-100 p-2 mb-2 border border-gray-300 rounded"
            />
            <button
              onClick={() => regenerateImage(setPlayer1)}
              className="text-blue-500 hover:underline"
            >
              Generate New Avatar
            </button>
          </div>
        </div>
      
        <div className="text-center w-1/3">
          <h2 className="text-xl mb-2">Player 2</h2>
          <img
            src={player2.image}
            alt="Player 2 Avatar"
            className="w-24 h-24 mx-auto rounded-full mb-4"
          />
          <div className="flex flex-col items-center">
            <input
              type="text"
              value={player2.alias}
              onChange={(e) => setPlayer2({ ...player2, alias: e.target.value })}
              placeholder="Enter Player 2 Name"
              className="w-100 p-2 mb-2 border border-gray-300 rounded"
            />
            <button
              onClick={() => regenerateImage(setPlayer2)}
              className="text-blue-500 hover:underline"
            >
              Generate New Avatar
            </button>
          </div>
        </div>
      </div>
      
      )}

      {gameStarted && (
        <div className="mb-6">
          <p className="flex justify-between w-full mt-4 max-w-2x1 text-lg font-bold">
            <span className="font-bold">{player1.alias} : {score.player1} </span>VS{' '}
            <span className="font-bold">{player2.alias} : {score.player2}</span>
          </p>
          <canvas ref={canvasRef} className="border-8 border-blue-900 rounded-lg" />
        </div>
      )}

      {winner && (
        <div className="mt-6 text-center">
          <p className="text-xl font-bold text-green-800">🏆 The Winner : {winner.alias} 🏆 </p>
          <button onClick={resetGame} className="bg-green-500 text-white py-2 px-4 rounded mt-4">
            Play Again
          </button>
        </div>
      )}

      {!gameStarted && !winner && (
        <button
          onClick={handleStartGame}
          className="bg-blue-500 text-white py-2 px-4 rounded disabled:bg-gray-400"
          disabled={gameStarted}
        >
          Start Game
        </button>
      )}
    </div>
  );
};

export default OneVsOneMatch;
