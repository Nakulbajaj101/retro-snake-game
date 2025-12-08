import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "@/components/AuthDialog";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    setScoreSubmitted(false);
    setShowLoginDialog(false);
  }, [generateFood]);

  const handleSubmitScore = useCallback(async () => {
    if (!isAuthenticated || scoreSubmitted || score === 0) return;

    try {
      await api.submitScore(score);
      setScoreSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      toast({
        title: 'Score Submitted!',
        description: `Your score of ${score} has been saved to the leaderboard.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit score',
        variant: 'destructive',
      });
    }
  }, [isAuthenticated, score, scoreSubmitted, toast, queryClient]);

  const [showLoginDialog, setShowLoginDialog] = useState(false);

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
        // Score submission logic is now handled by useEffect
        if (isAuthenticated && score > 0) {
          handleSubmitScore();
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
  }, [direction, food, gameOver, isPaused, checkCollision, generateFood, score, highScore, isAuthenticated, handleSubmitScore]);

  // Effect to handle auto-opening login dialog on game over
  useEffect(() => {
    if (gameOver && !isAuthenticated && score > 0) {
      setShowLoginDialog(true);
    }
  }, [gameOver, isAuthenticated, score]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't capture keys if user is typing in an input, textarea, or select
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

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

    // Clear canvas with light background
    ctx.fillStyle = "#f0f7ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid
    ctx.strokeStyle = "#d1e3f5";
    ctx.lineWidth = 1;
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

    // Draw food (bright orange circle with pattern)
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;

    // Outer circle
    ctx.fillStyle = "#ff6b35";
    ctx.beginPath();
    ctx.arc(foodX, foodY, CELL_SIZE / 2 - 2, 0, 2 * Math.PI);
    ctx.fill();

    // Inner circle for pattern
    ctx.fillStyle = "#ff8c61";
    ctx.beginPath();
    ctx.arc(foodX, foodY, CELL_SIZE / 4, 0, 2 * Math.PI);
    ctx.fill();

    // Draw snake with clear colors
    snake.forEach((segment, index) => {
      const x = segment.x * CELL_SIZE;
      const y = segment.y * CELL_SIZE;

      if (index === 0) {
        // Snake head - darker teal with eyes
        ctx.fillStyle = "#00a896";
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

        // Draw eyes based on direction
        ctx.fillStyle = "#ffffff";
        const eyeSize = 3;
        const eyeOffset = 6;

        if (direction.x === 1) { // Right
          ctx.fillRect(x + CELL_SIZE - eyeOffset, y + 5, eyeSize, eyeSize);
          ctx.fillRect(x + CELL_SIZE - eyeOffset, y + CELL_SIZE - 8, eyeSize, eyeSize);
        } else if (direction.x === -1) { // Left
          ctx.fillRect(x + eyeOffset - eyeSize, y + 5, eyeSize, eyeSize);
          ctx.fillRect(x + eyeOffset - eyeSize, y + CELL_SIZE - 8, eyeSize, eyeSize);
        } else if (direction.y === -1) { // Up
          ctx.fillRect(x + 5, y + eyeOffset - eyeSize, eyeSize, eyeSize);
          ctx.fillRect(x + CELL_SIZE - 8, y + eyeOffset - eyeSize, eyeSize, eyeSize);
        } else { // Down
          ctx.fillRect(x + 5, y + CELL_SIZE - eyeOffset, eyeSize, eyeSize);
          ctx.fillRect(x + CELL_SIZE - 8, y + CELL_SIZE - eyeOffset, eyeSize, eyeSize);
        }
      } else {
        // Snake body - lighter teal with stripes
        ctx.fillStyle = "#02c39a";
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

        // Add stripe pattern for texture
        ctx.fillStyle = "#05d9b8";
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, 3);
      }

      // Border for each segment
      ctx.strokeStyle = "#028174";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    });
  }, [snake, food, direction]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-4">
      <div className="text-center space-y-3">
        <h1 className="text-6xl font-bold text-primary mb-2 tracking-wide drop-shadow-lg">
          🐍 SNAKE GAME (DEBUG MODE)
        </h1>

        {/* User Info */}
        <div className="flex items-center justify-center gap-4">
          {isAuthenticated ? (
            <div className="bg-white px-6 py-2 rounded-lg shadow-md border-2 border-green-500">
              <span className="text-sm text-foreground">👤 {user?.username}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="ml-2 text-xs"
              >
                Logout
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="border-2 border-primary"
              onClick={() => setShowLoginDialog(true)}
            >
              🔐 Login / Register
            </Button>
          )}
        </div>

        <div className="flex gap-8 justify-center text-2xl font-bold">
          <div className="bg-white px-6 py-3 rounded-lg shadow-md border-2 border-primary">
            <span className="text-foreground">Score: </span>
            <span className="text-primary">{score}</span>
          </div>
          <div className="bg-white px-6 py-3 rounded-lg shadow-md border-2 border-secondary">
            <span className="text-foreground">Best: </span>
            <span className="text-secondary">{highScore}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Render AuthDialog always, allowing it to be controlled via state */}
        <AuthDialog
          isOpen={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          onSuccess={() => {
            handleSubmitScore();
            setShowLoginDialog(false);
          }}
        />

        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="border-4 border-primary rounded-lg shadow-2xl bg-white"
        />

        {(gameOver || isPaused) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/95 rounded-lg backdrop-blur-sm z-10">
            <div className="text-center space-y-6 p-8">
              {gameOver ? (
                <>
                  <h2 className="text-5xl font-bold text-destructive animate-bounce-small">
                    😢 GAME OVER!
                  </h2>
                  <p className="text-3xl font-bold text-foreground">
                    Your Score: <span className="text-primary">{score}</span>
                  </p>

                  {/* Debug Info - Always visible on Game Over */}
                  <div className="bg-red-600 text-white p-4 rounded-lg text-sm font-mono my-4 text-left inline-block border-4 border-yellow-400">
                    <p className="font-bold underline">!!! DEBUG MODE !!!</p>
                    <p>Game Over: {gameOver ? 'YES' : 'NO'}</p>
                    <p>Auth: {isAuthenticated ? 'LOGGED IN' : 'GUEST'}</p>
                    <p>Score: {score}</p>
                    <p>Dialog Request: {showLoginDialog ? 'OPEN' : 'CLOSED'}</p>
                  </div>

                  {scoreSubmitted && (
                    <p className="text-sm text-green-600 font-semibold">
                      ✅ Score saved to leaderboard!
                    </p>
                  )}
                  {!isAuthenticated && score > 0 && (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-lg font-medium text-muted-foreground">
                        Register or Login for your scores to reflect
                      </p>

                      <Button
                        variant="default"
                        className="w-full max-w-xs font-semibold animate-pulse"
                        onClick={() => setShowLoginDialog(true)}
                      >
                        🔐 Login / Register
                      </Button>
                    </div>
                  )}
                  <Button
                    onClick={resetGame}
                    size="lg"
                    className="bg-primary text-white hover:bg-primary/90 font-bold px-10 py-7 text-xl rounded-full shadow-lg"
                  >
                    🎮 Play Again!
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="text-5xl font-bold text-primary animate-bounce-small">
                    🎮 Ready?
                  </h2>
                  <Button
                    onClick={() => setIsPaused(false)}
                    size="lg"
                    className="bg-primary text-white hover:bg-primary/90 font-bold px-10 py-7 text-xl rounded-full shadow-lg"
                  >
                    ▶️ Start Game!
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="text-center space-y-2 bg-white px-8 py-4 rounded-lg shadow-md border-2 border-border">
        <p className="text-lg font-semibold text-foreground">
          ⌨️ Use Arrow Keys or WASD to move
        </p>
        <p className="text-lg font-semibold text-foreground">
          ⏸️ Press Space or P to pause
        </p>
      </div>
    </div>
  );
};
