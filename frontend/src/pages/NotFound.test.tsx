import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NotFound from './NotFound';
import { BrowserRouter } from 'react-router-dom';

describe('NotFound', () => {
    it('renders 404 message and link to home', () => {
        render(
            <BrowserRouter>
                <NotFound />
            </BrowserRouter>
        );
        expect(screen.getByText(/404/i)).toBeInTheDocument();
        expect(screen.getByText(/Oops! Page not found/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Return to Home/i })).toBeInTheDocument();
    });
});
