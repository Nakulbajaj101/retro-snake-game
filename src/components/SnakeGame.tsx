import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "./ui/button";

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const GAME_SPEED = 150;

type Position = { x: number; y: number };
type Direction = { x: number; y: number };

export const SnakeGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const gameLoopRef = useRef<NodeJS.Timeout>();

  const generateFood = useCallback((currentSnake: Position[]) => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y)
    );
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  }, [generateFood]);

  const checkCollision = useCallback((head: Position, body: Position[]) => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    // Self collision
    return body.some((segment) => segment.x === head.x && segment.y === head.y);
  }, []);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake((prevSnake) => {
      const newHead = {
        x: prevSnake[0].x + direction.x,
        y: prevSnake[0].y + direction.y,
      };

      if (checkCollision(newHead, prevSnake.slice(1))) {
        setGameOver(true);
        setIsPaused(true);
        if (score > highScore) {
          setHighScore(score);
        }
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if snake ate food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((prev) => prev + 10);
        setFood(generateFood(newSnake));
        return newSnake;
      }

      // Remove tail if no food eaten
      newSnake.pop();
      return newSnake;
    });
  }, [direction, food, gameOver, isPaused, checkCollision, generateFood, score, highScore]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver && (e.key === " " || e.key === "Enter")) {
        resetGame();
        return;
      }

      if (e.key === " " || e.key === "p" || e.key === "P") {
        setIsPaused((prev) => !prev);
        return;
      }

      const keyMap: { [key: string]: Direction } = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };

      const newDirection = keyMap[e.key];
      if (newDirection) {
        e.preventDefault();
        setDirection((prevDirection) => {
          // Prevent reverse direction
          if (
            newDirection.x === -prevDirection.x &&
            newDirection.y === -prevDirection.y
          ) {
            return prevDirection;
          }
          return newDirection;
        });
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameOver, resetGame]);

  useEffect(() => {
    gameLoopRef.current = setInterval(moveSnake, GAME_SPEED);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "hsl(var(--game-bg))";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "hsl(var(--game-border))";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw food
    ctx.fillStyle = "hsl(var(--glow))";
    ctx.shadowColor = "hsl(var(--glow))";
    ctx.shadowBlur = 10;
    ctx.fillRect(food.x * CELL_SIZE + 2, food.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);

    // Draw snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? "hsl(var(--glow-intense))" : "hsl(var(--glow))";
      ctx.shadowColor = "hsl(var(--glow))";
      ctx.shadowBlur = index === 0 ? 15 : 8;
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });

    ctx.shadowBlur = 0;
  }, [snake, food]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-bold retro-glow-intense mb-2 tracking-wider">
          SNAKE
        </h1>
        <div className="flex gap-8 justify-center text-xl retro-glow">
          <div>SCORE: {score}</div>
          <div>HIGH: {highScore}</div>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="border-4 border-primary retro-box-glow bg-[hsl(var(--game-bg))]"
        />
        
        {(gameOver || isPaused) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90">
            <div className="text-center space-y-4 p-8">
              {gameOver ? (
                <>
                  <h2 className="text-4xl font-bold retro-glow-intense animate-pulse-glow">
                    GAME OVER
                  </h2>
                  <p className="text-xl retro-glow">SCORE: {score}</p>
                  <Button
                    onClick={resetGame}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 retro-glow font-bold px-8 py-6 text-lg"
                  >
                    PRESS SPACE TO RESTART
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="text-4xl font-bold retro-glow-intense animate-pulse-glow">
                    PAUSED
                  </h2>
                  <Button
                    onClick={() => setIsPaused(false)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 retro-glow font-bold px-8 py-6 text-lg"
                  >
                    PRESS SPACE TO START
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-sm retro-glow space-y-1 max-w-md">
        <p>ARROW KEYS or WASD TO MOVE</p>
        <p>SPACE or P TO PAUSE</p>
      </div>
    </div>
  );
};
