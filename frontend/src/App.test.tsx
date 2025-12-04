import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
    it('renders without crashing', () => {
        render(<App />);
        // Check if the Toaster is present (it's in the App component)
        // or just check body.
        expect(document.body).toBeInTheDocument();
    });
});
