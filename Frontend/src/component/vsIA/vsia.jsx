import React, { useRef, useEffect, useState } from 'react';

export const model = {
    "key": 2193,
    "connections": [
      {
        "key": [
          -1,
          0
        ],
        "weight": 0.10712592235710172,
        "enabled": false
      },
      {
        "key": [
          -1,
          1
        ],
        "weight": 2.226416270951379,
        "enabled": false
      },
      {
        "key": [
          -2,
          2
        ],
        "weight": 2.1653029335398886,
        "enabled": true
      },
      {
        "key": [
          -3,
          1
        ],
        "weight": 2.385845538406643,
        "enabled": true
      },
      {
        "key": [
          -2,
          0
        ],
        "weight": 0.8033210735790193,
        "enabled": true
      },
      {
        "key": [
          -1,
          288
        ],
        "weight": -0.038220384733030244,
        "enabled": true
      },
      {
        "key": [
          -3,
          2
        ],
        "weight": -2.297624624741982,
        "enabled": false
      },
      {
        "key": [
          -3,
          492
        ],
        "weight": -0.6876355281641421,
        "enabled": true
      },
      {
        "key": [
          -1,
          531
        ],
        "weight": -1.4737939706715888,
        "enabled": true
      },
      {
        "key": [
          594,
          288
        ],
        "weight": 2.2200976288408807,
        "enabled": true
      }
    ],
    "nodes": [
      {
        "key": 0,
        "bias": 3.487597478514236,
        "response": 1.0,
        "activation": "relu",
        "aggregation": "sum"
      },
      {
        "key": 1,
        "bias": 0.2715504777215128,
        "response": 1.0,
        "activation": "relu",
        "aggregation": "sum"
      },
      {
        "key": 2,
        "bias": 4.912182824840164,
        "response": 1.0,
        "activation": "relu",
        "aggregation": "sum"
      },
      {
        "key": 288,
        "bias": 5.43960711196676,
        "response": 1.0,
        "activation": "relu",
        "aggregation": "sum"
      },
      {
        "key": 492,
        "bias": 2.382396106309587,
        "response": 1.0,
        "activation": "relu",
        "aggregation": "sum"
      },
      {
        "key": 531,
        "bias": 2.873180570750076,
        "response": 1.0,
        "activation": "relu",
        "aggregation": "sum"
      },
      {
        "key": 594,
        "bias": 3.6871853741033718,
        "response": 1.0,
        "activation": "relu",
        "aggregation": "sum"
      }
    ],
    "fitness": 494
  }

// Game Constants
const MAX_VEL = 18;
const BALL_RADIUS = 8;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 150;
const PADDLE_VEL = 14;

// NEAT Model  

// Activation function
const activateRelu = (x) => Math.max(0, x);

const feedForward = (inputs, model) => {
  const nodeValues = {};
  
  // Set input nodes (NEAT uses -1, -2, -3 for inputs)
  nodeValues[-1] = inputs[0]; // ball.x
  nodeValues[-2] = inputs[1]; // ball.y
  nodeValues[-3] = inputs[2]; // paddle.y

  // Process all nodes in order
  model.nodes.forEach(node => {
      let sum = node.bias;
      
      model.connections
          .filter(conn => conn.enabled && conn.key[1] === node.key)
          .forEach(conn => {
              sum += (nodeValues[conn.key[0]] || 0) * conn.weight;
          });
      
      nodeValues[node.key] = activateRelu(sum * node.response);
  });

  // Output nodes (assuming 0=stay, 1=up, 2=down)
  return [
      nodeValues[0] || 0,
      nodeValues[1] || 0,
      nodeValues[2] || 0
  ];
};

// Ball Component
class Ball {
  constructor(x, y) {
    this.x = this.original_x = x;
    this.y = this.original_y = y;
    
    const angle = this._getRandomAngle(-30, 30, [0]);
    const pos = Math.random() < 0.5 ? 1 : -1;
    
    this.x_vel = pos * Math.abs(Math.cos(angle) * MAX_VEL);
    this.y_vel = Math.sin(angle) * MAX_VEL;
  }
  
  _getRandomAngle(minAngle, maxAngle, excluded) {
    let angle = 0;
    while (excluded.includes(angle)) {
      angle = (Math.random() * (maxAngle - minAngle) + minAngle) * Math.PI / 180;
    }
    return angle;
  }
  
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();
  }
  
  move() {
    this.x += this.x_vel;
    this.y += this.y_vel;
  }
  
  reset() {
    this.x = this.original_x;
    this.y = this.original_y;
    
    const angle = this._getRandomAngle(-30, 30, [0]);
    const x_vel = Math.abs(Math.cos(angle) * MAX_VEL);
    const y_vel = Math.sin(angle) * MAX_VEL;
    
    this.y_vel = y_vel;
    this.x_vel *= -1;
  }
}

// Paddle Component
class Paddle {
  constructor(x, y) {
    this.x = this.original_x = x;
    this.y = this.original_y = y;
    this.width = PADDLE_WIDTH;
    this.height = PADDLE_HEIGHT;
    this.vel = PADDLE_VEL;
  }
  
  draw(ctx) {
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();
  }
  
  
  move(up = true) {
    if (up) {
      this.y -= this.vel;
    } else {
      this.y += this.vel;
    }
  }
  
  reset() {
    this.x = this.original_x;
    this.y = this.original_y;
  }
}


// Game Component
const PongGame = ({ width = 1080, height = 720 }) => {
  const canvasRef = useRef(null);
  const [leftScore, setLeftScore] = useState(0);
  const [rightScore, setRightScore] = useState(0);
  const [leftHits, setLeftHits] = useState(0);
  const [rightHits, setRightHits] = useState(0);
  const [aiActive, setAiActive] = useState(true);
  const [debugInfo, setDebugInfo] = useState({ inputs: [], outputs: [], decision: null });
  const [countdown, setCountdown] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [dimensions, setDimensions] = useState({ 
    width: 1080, 
    height: 720,
    displayWidth: 1080,
    displayHeight: 720
  });

  // Game objects
  const ballRef = useRef(null);
  const leftPaddleRef = useRef(null);
  const rightPaddleRef = useRef(null);
  
  // Key states
  const keysRef = useRef({
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false
  });

  // Animation frame reference
  const animationFrameRef = useRef(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (!container) return;
      
      // Calculate available space while maintaining 3:2 aspect ratio
      const maxWidth = Math.min(window.innerWidth * 0.9, 1080);
      const maxHeight = Math.min(window.innerHeight * 0.8, 720);
      
      let displayWidth, displayHeight;
      
      if (maxWidth / maxHeight > 1.5) {
        displayHeight = maxHeight;
        displayWidth = displayHeight * 1.5;
      } else {
        displayWidth = maxWidth;
        displayHeight = displayWidth / 1.5;
      }
      
      setDimensions({
        width: 1080,
        height: 720,
        displayWidth,
        displayHeight
      });
      
      // Reposition game objects
      if (ballRef.current && leftPaddleRef.current && rightPaddleRef.current) {
        ballRef.current.original_x = 1080 / 2;
        ballRef.current.original_y = 720 / 2;
        leftPaddleRef.current.original_x = 10;
        leftPaddleRef.current.original_y = (720 / 2) - (PADDLE_HEIGHT / 2);
        rightPaddleRef.current.original_x = 1080 - 10 - PADDLE_WIDTH;
        rightPaddleRef.current.original_y = (720 / 2) - (PADDLE_HEIGHT / 2);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startCountdown = () => {
    let counter = 3;
    setCountdown(counter);
    
    const timer = setInterval(() => {
      counter--;
      
      if (counter > 0) {
        setCountdown(counter);
      } else if (counter === 0) {
        setCountdown('START');
      } else {
        clearInterval(timer);
        setCountdown(null);
        
        const ball = ballRef.current;
        ball.x = ball.original_x;
        ball.y = ball.original_y;
        
        const angle = ball._getRandomAngle(-30, 30, [0]);
        const pos = Math.random() < 0.5 ? 1 : -1;
        ball.x_vel = pos * Math.abs(Math.cos(angle) * MAX_VEL);
        ball.y_vel = Math.sin(angle) * MAX_VEL;
      }
    }, 1000);
  };

  // AI decision making
  const makeAiDecision = () => {
    if (!ballRef.current || !rightPaddleRef.current) return;

    const ball = ballRef.current;
    const rightPaddle = rightPaddleRef.current;
    
    const inputs = [
      ball.x,
      ball.y,
      rightPaddle.y  
    ];
    
    const outputs = feedForward(inputs, model);
    const decision = outputs.indexOf(Math.max(...outputs));
    
    setDebugInfo({ inputs, outputs, decision });
    
    if (decision === 1 && rightPaddle.y > 0) {
      rightPaddle.move(true);
    } else if (decision === 2 && rightPaddle.y < height - PADDLE_HEIGHT) {
      rightPaddle.move(false);
    }
    else
    {
      //stay
    }
  };

  // Handle collision
  const handleCollision = () => {
    const ball = ballRef.current;
    const leftPaddle = leftPaddleRef.current;
    const rightPaddle = rightPaddleRef.current;
    
    // Wall collision
    if (ball.y + BALL_RADIUS >= height || ball.y - BALL_RADIUS <= 0) {
      ball.y_vel *= -1;
    }
    
    // Paddle collision
    if (ball.x_vel < 0) {
      // Left paddle
      if (ball.y >= leftPaddle.y && ball.y <= leftPaddle.y + PADDLE_HEIGHT && 
          ball.x - BALL_RADIUS <= leftPaddle.x + PADDLE_WIDTH) {
        ball.x_vel *= -1;
        const relativeIntersect = (leftPaddle.y + PADDLE_HEIGHT/2) - ball.y;
        const normalized = relativeIntersect / (PADDLE_HEIGHT/2);
        ball.y_vel = -normalized * MAX_VEL;
        setLeftHits(prev => prev + 1);
      }
    } else {
      // Right paddle
      if (ball.y >= rightPaddle.y && ball.y <= rightPaddle.y + PADDLE_HEIGHT && 
          ball.x + BALL_RADIUS >= rightPaddle.x) {
        ball.x_vel *= -1;
        const relativeIntersect = (rightPaddle.y + PADDLE_HEIGHT/2) - ball.y;
        const normalized = relativeIntersect / (PADDLE_HEIGHT/2);
        ball.y_vel = -normalized * MAX_VEL;
        setRightHits(prev => prev + 1);
      }
    }
  };
  
  // Update game state
  const update = () => {
    if (gameOver) return;

    const ball = ballRef.current;
    const leftPaddle = leftPaddleRef.current;
    const rightPaddle = rightPaddleRef.current;
    const keys = keysRef.current;

    // Move left paddle
    if (keys.w && leftPaddle.y > 0) leftPaddle.move(true);
    if (keys.s && leftPaddle.y < height - PADDLE_HEIGHT) leftPaddle.move(false);
    
    // Move right paddle (AI or player)
    if (aiActive) makeAiDecision();

    // Move ball and handle collisions
    ball.move();
    handleCollision();
    
    // Scoring
    if (ball.x < 0) {
      setRightScore(prevScore => {
        const newScore = prevScore + 1;
        console.log("newScore1 ====> ", newScore);
        if (newScore >= 5) {
          setGameOver(true);
          setWinner('AI');
        }
        return newScore;
      });
      
      ball.reset();
      rightPaddleRef.current.reset();
      leftPaddleRef.current.reset();
      ball.x_vel = 0;
      ball.y_vel = 0;
      startCountdown();
    } else if (ball.x > width) {
      setLeftScore(prevScore => {
        const newScore = prevScore + 1;
        console.log("newScore2 ====> ", newScore);
        if (newScore >= 5) {
          setGameOver(true);
          setWinner('Player');
        }
        return newScore;
      });
      
      ball.reset();
      rightPaddleRef.current.reset();
      leftPaddleRef.current.reset();
      ball.x_vel = 0;
      ball.y_vel = 0;
      startCountdown();
    }
  };

  const restartGame = () => {
    setLeftScore(0);
    setRightScore(0);
    setLeftHits(0);
    setRightHits(0);
    setGameOver(false);
    setWinner(null);
    setCountdown(null);
    
    // Reset game objects
    ballRef.current.reset();
    leftPaddleRef.current.reset();
    rightPaddleRef.current.reset();
    
    // Reset ball velocity
    const ball = ballRef.current;
    const angle = ball._getRandomAngle(-30, 30, [0]);
    const pos = Math.random() < 0.5 ? 1 : -1;
    ball.x_vel = pos * Math.abs(Math.cos(angle) * MAX_VEL);
    ball.y_vel = Math.sin(angle) * MAX_VEL;
    
    // Reset key states
    keysRef.current = {
      w: false,
      s: false,
      ArrowUp: false,
      ArrowDown: false
    };
  };

  const draw = (ctx) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    
    // Calculate scale factors
    const scaleX = dimensions.displayWidth / dimensions.width;
    const scaleY = dimensions.displayHeight / dimensions.height;
    
    // Save context before scaling
    ctx.save();
    ctx.scale(scaleX, scaleY);
    
    if (!gameOver) {
      // Draw game elements
      leftPaddleRef.current.draw(ctx);
      rightPaddleRef.current.draw(ctx);
      ballRef.current.draw(ctx);
      
      // Draw divider
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(dimensions.width / 2, 0);
      ctx.lineTo(dimensions.width / 2, dimensions.height);
      ctx.stroke();
      ctx.setLineDash([]);
      
    } else {
      // Draw game over screen
      ctx.font = 'bold 60px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${winner} Wins!`, dimensions.width / 2, dimensions.height / 2 - 50);
      
      ctx.font = '30px Arial';
      ctx.fillText('Press SPACE to restart', dimensions.width / 2, dimensions.height / 2 + 50);
    }
    
    ctx.restore();
  };

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Initialize game objects
    ballRef.current = new Ball(width / 2, height / 2);
    leftPaddleRef.current = new Paddle(10, height / 2 - PADDLE_HEIGHT / 2);
    rightPaddleRef.current = new Paddle(width - 10 - PADDLE_WIDTH, height / 2 - PADDLE_HEIGHT / 2);
    
    // Event listeners
    const handleKeyDown = (e) => {
      if (['w', 's', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        keysRef.current[e.key] = true;
        
        if (e.key === ' ') {
          if (gameOver) {
            restartGame();
          } else {
            setAiActive(prev => !prev);
          }
        }
      }
    };
    
    const handleKeyUp = (e) => {
      if (['w', 's', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        keysRef.current[e.key] = false;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Game loop
    let lastTime = 0;
    const frameRate = 60;
    const frameDelay = 1000 / frameRate;

    const gameLoop = (timestamp) => {
      if (timestamp - lastTime > frameDelay) {
        update();
        draw(ctx);
        lastTime = timestamp;
      }
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameOver]);

  const getScoreColors = () => {
    if (leftScore > rightScore) {
      return { playerColor: 'black', aiColor: 'black' };
    } else if (rightScore > leftScore) {
      return { playerColor: 'black', aiColor: 'black' };
    }
    return { playerColor: 'black', aiColor: 'black' };
  };

  const { playerColor, aiColor } = getScoreColors();
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      margin: 0,
      padding: '20px 0',
      overflow: 'hidden'
    }}>
      {/* Score Display */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        width: `${dimensions.displayWidth}px`, 
        maxWidth: '90vw', 
        marginBottom: '20px', 
        fontFamily: '"Courier New", monospace', 
        fontSize: '34px', 
        fontWeight: 'bold'
      }}>
        <div style={{ 
          color: gameOver && winner === 'Player' ? 'green' : playerColor,
          textShadow: gameOver && winner === 'Player' ? '0 0 10px lime' : 'none'
        }}>
          Player: {leftScore} {gameOver && winner === 'Player' && '🏆'}
        </div>
        <div style={{ 
          color: gameOver && winner === 'AI' ? 'green' : aiColor,
          textShadow: gameOver && winner === 'AI' ? '0 0 10px lime' : 'none'
        }}>
          AI: {rightScore} {gameOver && winner === 'AI' && '🏆'}
        </div>
      </div>
  
      {/* Game Canvas Container */}
      <div style={{
        position: 'relative',
        width: `${dimensions.displayWidth}px`,
        height: `${dimensions.displayHeight}px`,
        maxWidth: '90vw',
        maxHeight: 'calc(90vw / 1.5)',
        border: '2px solid blue',
        borderRadius: '20px',
        boxSizing: 'border-box'
      }}>
        <canvas 
          ref={canvasRef} 
          width={dimensions.width} 
          height={dimensions.height}
          style={{
            width: '100%',
            height: '100%',
            border: '2px solid white',
            borderRadius: '10px',
            imageRendering: 'pixelated'
          }}
        />
      </div>
    </div>
  );
};

export default PongGame;


