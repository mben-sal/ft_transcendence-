import React, { useEffect, useRef, useState } from 'react';

const PingPongGame = ({ player1Name = "Player 1", player2Name = "Player 2", onGameEnd }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const gameStateRef = useRef({
    ball: { x: 0, y: 0, dx: 0, dy: 0, radius: 10 },
    player1: { x: 0, y: 0, width: 15, height: 100, speed: 8, upKey: false, downKey: false },
    player2: { x: 0, y: 0, width: 15, height: 100, speed: 8, upKey: false, downKey: false },
    canvasWidth: 600,
    canvasHeight: 400,
    gameActive: true
  });

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
        case 'w': state.player1.upKey = true; break;
        case 's': state.player1.downKey = true; break;
        case 'o': state.player2.upKey = true; break;
        case 'l': state.player2.downKey = true; break;
      }
    };

    const handleKeyUp = (e) => {
      const state = gameStateRef.current;
      switch (e.key.toLowerCase()) {
        case 'w': state.player1.upKey = false; break;
        case 's': state.player1.downKey = false; break;
        case 'o': state.player2.upKey = false; break;
        case 'l': state.player2.downKey = false; break;
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
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = gameStateRef.current;

    initGame();

    const gameLoop = setInterval(() => {
      if (!state.gameActive) {
        clearInterval(gameLoop);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

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

      state.ball.x += state.ball.dx;
      state.ball.y += state.ball.dy;

      if (state.ball.y - state.ball.radius < 0 || state.ball.y + state.ball.radius > canvas.height) {
        state.ball.dy = -state.ball.dy;
      }

      if (state.ball.x - state.ball.radius < state.player1.x + state.player1.width &&
          state.ball.y > state.player1.y && state.ball.y < state.player1.y + state.player1.height) {
        state.ball.dx = -state.ball.dx * 1.05;
      }

      if (state.ball.x + state.ball.radius > state.player2.x &&
          state.ball.y > state.player2.y && state.ball.y < state.player2.y + state.player2.height) {
        state.ball.dx = -state.ball.dx * 1.05;
      }

      if (state.ball.x - state.ball.radius < 0) {
        setScore(prev => {
          const newScore = { ...prev, player2: prev.player2 + 1 };
          if (newScore.player2 >= 5) {
            state.gameActive = false;
            onGameEnd?.(2);
          }
          return newScore;
        });
        resetBall();
      } else if (state.ball.x + state.ball.radius > canvas.width) {
        setScore(prev => {
          const newScore = { ...prev, player1: prev.player1 + 1 };
          if (newScore.player1 >= 5) {
            state.gameActive = false;
            onGameEnd?.(1);
          }
          return newScore;
        });
        resetBall();
      }

      // Draw game elements
      drawGame(ctx, state);
    }, 1000 / 60);

    const resetBall = () => {
      state.ball.x = canvas.width / 2;
      state.ball.y = canvas.height / 2;
      state.ball.dx = 5 * (Math.random() > 0.5 ? 1 : -1);
      state.ball.dy = 5 * (Math.random() > 0.5 ? 1 : -1);
    };

    const drawGame = (ctx, state) => {
      ctx.fillStyle = 'black';
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

      // Draw scores - kept the same as your original design
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(score.player1, state.canvasWidth / 4, 30);
      ctx.fillText(score.player2, state.canvasWidth * 3 / 4, 30);

      // Draw player names - kept the same as your original design
      ctx.font = '16px Arial';
      ctx.fillText(player1Name, state.canvasWidth / 4, state.canvasHeight - 10);
      ctx.fillText(player2Name, state.canvasWidth * 3 / 4, state.canvasHeight - 10);
    };

    return () => clearInterval(gameLoop);
  }, [score, onGameEnd, player1Name, player2Name]);

  return (
    <div style={{ textAlign: 'center', backgroundColor: '#1c1c1c', padding: '20px' }}>
      <canvas
        ref={canvasRef}
        style={{
          border: '2px solid white',
          backgroundColor: 'black',
          margin: '0 auto',
        }}
      />
    </div>
  );
};

export default PingPongGame;