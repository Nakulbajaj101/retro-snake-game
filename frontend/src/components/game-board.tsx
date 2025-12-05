import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const BOARD_SIZE = 400;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Point = { x: number; y: number };

export function GameBoard() {
    const { theme } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
    const [food, setFood] = useState<Point>({ x: 15, y: 15 });
    const [direction, setDirection] = useState<Direction>('RIGHT');
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Initialize game loop
    useEffect(() => {
        if (!isPlaying || gameOver) return;

        const moveSnake = () => {
            setSnake((prevSnake) => {
                const newHead = { ...prevSnake[0] };

                switch (direction) {
                    case 'UP': newHead.y -= 1; break;
                    case 'DOWN': newHead.y += 1; break;
                    case 'LEFT': newHead.x -= 1; break;
                    case 'RIGHT': newHead.x += 1; break;
                }

                // Check collisions
                if (
                    newHead.x < 0 ||
                    newHead.x >= GRID_SIZE ||
                    newHead.y < 0 ||
                    newHead.y >= GRID_SIZE ||
                    prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)
                ) {
                    setGameOver(true);
                    setIsPlaying(false);
                    return prevSnake;
                }

                const newSnake = [newHead, ...prevSnake];

                // Check food collision
                if (newHead.x === food.x && newHead.y === food.y) {
                    setScore((s) => s + 10);
                    setFood({
                        x: Math.floor(Math.random() * GRID_SIZE),
                        y: Math.floor(Math.random() * GRID_SIZE),
                    });
                } else {
                    newSnake.pop();
                }

                return newSnake;
            });
        };

        const gameLoop = setInterval(moveSnake, 150);
        return () => clearInterval(gameLoop);
    }, [isPlaying, gameOver, direction, food]);

    // Handle keyboard controls
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
                case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
                case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
                case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [direction]);

    // Draw game
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Helper to get color from CSS variable
        const getColor = (varName: string, fallback: string) => {
            const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
            if (!val) return fallback;
            // Check if it's already a color string or HSL values
            if (val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl')) return val;
            return `hsl(${val})`;
        };

        // Clear canvas
        ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

        // Draw grid (optional, for retro feel)
        ctx.strokeStyle = getColor('--grid-color', '#333');
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= BOARD_SIZE; i += CELL_SIZE) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, BOARD_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(BOARD_SIZE, i);
            ctx.stroke();
        }

        // Draw snake
        ctx.fillStyle = getColor('--snake-color', '#0f0');
        snake.forEach((segment) => {
            ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);

            // Add glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.fillStyle as string;
        });
        ctx.shadowBlur = 0; // Reset shadow

        // Draw food
        ctx.fillStyle = getColor('--food-color', '#f00');
        ctx.beginPath();
        ctx.arc(
            food.x * CELL_SIZE + CELL_SIZE / 2,
            food.y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 2 - 2,
            0,
            2 * Math.PI
        );
        ctx.fill();

        // Food glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = ctx.fillStyle as string;
        ctx.fill();
        ctx.shadowBlur = 0;

    }, [snake, food, theme]);

    // Submit score on game over
    const { user } = useAuth();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (gameOver && score > 0 && user) {
            api.submitScore(score).then(() => {
                queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
                toast.success(`Score submitted: ${score}`);
            }).catch((err) => {
                console.error('Failed to submit score:', err);
                toast.error('Failed to submit score');
            });
        }
    }, [gameOver, score, user, queryClient]);

    const startGame = () => {
        setSnake([{ x: 10, y: 10 }]);
        setScore(0);
        setGameOver(false);
        setIsPlaying(true);
        setDirection('RIGHT');
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative border-4 border-primary rounded-lg p-1 bg-card shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <canvas
                    ref={canvasRef}
                    width={BOARD_SIZE}
                    height={BOARD_SIZE}
                    className="bg-black/80 rounded"
                />
                {gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white rounded">
                        <h2 className="text-3xl font-bold mb-4 text-destructive">GAME OVER</h2>
                        <p className="text-xl mb-4">Score: {score}</p>
                        <Button onClick={startGame} size="lg" className="animate-pulse">
                            Try Again
                        </Button>
                    </div>
                )}
                {!isPlaying && !gameOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                        <Button onClick={startGame} size="lg" className="text-xl px-8 py-6">
                            Play Now
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex justify-between w-full max-w-[400px] text-xl font-mono">
                <div className="bg-card px-4 py-2 rounded border border-border">
                    Score: <span className="text-primary">{score}</span>
                </div>
                <div className="bg-card px-4 py-2 rounded border border-border">
                    High Score: <span className="text-accent-foreground">0</span>
                </div>
            </div>
        </div>
    );
}
