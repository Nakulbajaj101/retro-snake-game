import { render, screen, fireEvent } from '@/test/utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SnakeGame } from './SnakeGame';

describe('SnakeGame', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('renders game title and initial score', () => {
        render(<SnakeGame />);
        expect(screen.getByText(/SNAKE GAME/i)).toBeInTheDocument();
        expect(screen.getByText(/Score:/i)).toBeInTheDocument();
        // There are two '0's initially (Score and Best Score).
        // We can check if at least one exists, or check specifically.
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThanOrEqual(1);
    });

    it('renders start game overlay initially', () => {
        render(<SnakeGame />);
        expect(screen.getByText(/Ready\?/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Start Game!/i })).toBeInTheDocument();
    });

    it('starts game when start button is clicked', () => {
        render(<SnakeGame />);
        const startButton = screen.getByRole('button', { name: /Start Game!/i });
        fireEvent.click(startButton);

        // Overlay should disappear
        expect(screen.queryByText(/Ready\?/i)).not.toBeInTheDocument();
    });

    it('toggles pause when P key is pressed', () => {
        render(<SnakeGame />);
        const startButton = screen.getByRole('button', { name: /Start Game!/i });
        fireEvent.click(startButton);

        // Game is running now. Press P to pause.
        fireEvent.keyDown(window, { key: 'p' });

        // Pause overlay should appear (re-using the overlay structure)
        // The component shows "Ready?" or "Game Over" or nothing if running.
        // Wait, let's check the code. 
        // If isPaused is true, it shows the overlay.
        // If gameOver is false, it shows "Ready?" and "Start Game!".
        // So pausing effectively brings back the "Ready?" screen in this implementation?
        // Let's check SnakeGame.tsx again.
        // Line 250: {(gameOver || isPaused) && ( ... )}
        // Line 269: } : ( <> Ready? ... </> )
        // Yes, pausing shows the "Ready?" screen again.

        expect(screen.getByText(/Ready\?/i)).toBeInTheDocument();

        // Unpause
        fireEvent.keyDown(window, { key: 'p' });
        expect(screen.queryByText(/Ready\?/i)).not.toBeInTheDocument();
    });
});
