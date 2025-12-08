import { render, screen, fireEvent, act } from '@/test/utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SnakeGame } from './SnakeGame';
import * as AuthContext from '@/contexts/AuthContext';

// Mock the AuthContext
const useAuthMock = vi.fn();
vi.mock('@/contexts/AuthContext', async (importOriginal) => {
    const actual = await importOriginal<typeof AuthContext>();
    return {
        ...actual,
        useAuth: () => useAuthMock(),
    };
});

const mockRandom = vi.spyOn(Math, 'random');

describe('SnakeGame - Login Prompt Logic', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Setup default unauthenticated user
        useAuthMock.mockReturnValue({
            isAuthenticated: false,
            user: null,
            logout: vi.fn(),
            login: vi.fn(),
            register: vi.fn(),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('shows login prompt when unauthenticated user scores and dies', async () => {
        // Initial state: Snake (10, 10), Food (15, 15), Dir (1, 0) [Right]
        // We need to move to (15, 15) to eat.

        render(<SnakeGame />);

        // Start Game
        const startButton = screen.getByRole('button', { name: /Start Game!/i });
        fireEvent.click(startButton);

        // 1. Move Right 5 times (10,10 -> 15,10)
        act(() => {
            vi.advanceTimersByTime(150 * 5);
        });

        // 2. Turn Down
        fireEvent.keyDown(window, { key: 'ArrowDown' });

        // 3. Move Down 5 times (15,10 -> 15,15) -> EAT FOOD
        act(() => {
            vi.advanceTimersByTime(150 * 5);
        });

        // 4. Verify Score is 10
        expect(screen.getByText('10')).toBeInTheDocument();

        // 5. Navigate to wall
        // Snake is facing Down at (15, 15). Grid height is 20.
        // Wall is at y=20. Distance=5.
        // Move 10 steps to be sure we hit the wall and crash.
        act(() => {
            vi.advanceTimersByTime(150 * 10);
        });

        // 6. Verify Game Over
        expect(screen.getByText(/GAME OVER!/i)).toBeInTheDocument();

        // 7. Verify Login Prompt is visible
        expect(screen.getByText(/Register or Login for your scores to reflect/i)).toBeInTheDocument();

        // Verify Dialog Button
        const loginButtons = screen.getAllByText(/Login \/ Register/i);
        expect(loginButtons.length).toBeGreaterThan(1);
    });

    it('does NOT show login prompt if score is 0', async () => {
        // Setup unauthenticated
        useAuthMock.mockReturnValue({ isAuthenticated: false });

        render(<SnakeGame />);
        fireEvent.click(screen.getByRole('button', { name: /Start Game!/i }));

        // Snake (10, 10), Right. Wall at x=20.
        // 10 steps to wall.
        act(() => {
            vi.advanceTimersByTime(150 * 15);
        });

        expect(screen.getByText(/GAME OVER!/i)).toBeInTheDocument();

        // Check for score 0. There might be multiple "0"s on screen.
        // Score: 0, Best: 0, Your Score: 0
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThan(0);

        // Expect NO prompt
        expect(screen.queryByText(/Register or Login for your scores to reflect/i)).not.toBeInTheDocument();

        // Expect NO debug text saying "Dialog Request: OPEN" (since logic shouldn't trigger)
        // Note: The UI now has debug text, we can check if it says "CLOSED"
        expect(screen.getByText(/Dialog Request: CLOSED/i)).toBeInTheDocument();
    });

    it('does NOT show login prompt for AUTHENTICATED user even with high score', async () => {
        // Setup AUTHENTICATED user
        useAuthMock.mockReturnValue({
            isAuthenticated: true,
            user: { username: 'TestUser' },
            logout: vi.fn()
        });

        // Mock food to be reachable (11, 10)
        // Note: generateFood is called ONCE during initialization in resetGame/useEffect?
        // Let's trace:
        // component mount -> useState(INITIAL_SNAKE) -> food State {15,15} (default in code)
        // Wait, SnakeGame.tsx:
        // const [food, setFood] = useState<Position>({ x: 15, y: 15 });
        // So initially it is ALWAYS (15, 15).
        // My previous test assumption was that it uses generateFood initially? 
        // Code: const [food, setFood] = useState<Position>({ x: 15, y: 15 });
        // It does NOT call generateFood initially. It is hardcoded to 15,15.
        // Ah! My previous passed test worked because 15,15 is reachable if I move right then down.
        // But for this test I tried to mock it to (11,10) assuming it calls random. It does NOT.
        // It stays at 15,15.

        // So to eat food: Snake(10,10) -> Right x5 -> (15,10) -> Down x5 -> (15,15).

        render(<SnakeGame />);
        fireEvent.click(screen.getByRole('button', { name: /Start Game!/i }));

        // 1. Eat Food
        // Move Right 5 times
        act(() => {
            vi.advanceTimersByTime(150 * 5);
        });

        // Turn Down
        fireEvent.keyDown(window, { key: 'ArrowDown' });

        // Move Down 5 times -> Eat
        act(() => {
            vi.advanceTimersByTime(150 * 5);
        });

        // Verify score 10
        expect(screen.getByText('10')).toBeInTheDocument();

        // 2. Die (Move to wall)
        // Snake at (15, 15), Down. Wall at y=20. 5 steps.
        act(() => {
            vi.advanceTimersByTime(150 * 6);
        });

        expect(screen.getByText(/GAME OVER!/i)).toBeInTheDocument();
        // expect(screen.getByText('10')).toBeInTheDocument(); // Already checked

        // Should NOT show login prompt
        expect(screen.queryByText(/Register or Login for your scores to reflect/i)).not.toBeInTheDocument();

        // Debug status check
        expect(screen.getByText(/Auth: LOGGED IN/i)).toBeInTheDocument();
    });
});
