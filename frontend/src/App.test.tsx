import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App';

describe('App', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('renders without crashing', () => {
        // App already includes all providers (QueryClient, Auth, Router, etc.)
        render(<App />);
        // Check if the app renders - look for the game title
        expect(screen.getByText(/Retro Snake/i)).toBeInTheDocument();
    });
});
