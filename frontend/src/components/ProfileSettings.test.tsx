import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileSettings } from './profile-settings';
import { ThemeProvider } from './theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

describe('ProfileSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('token', 'fake-token');
    });

    it('renders profile settings dialog', () => {
        render(
            <AuthProvider>
                <ThemeProvider>
                    <ProfileSettings />
                </ThemeProvider>
            </AuthProvider>
        );

        // Open dialog
        fireEvent.click(screen.getByRole('button'));

        expect(screen.getByText('Profile Settings')).toBeInTheDocument();
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(screen.getByText('Theme')).toBeInTheDocument();
    });

    it('updates profile on save', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ display_name: 'New Name', theme_preference: 'cyber-punk' }),
        });

        render(
            <AuthProvider>
                <ThemeProvider>
                    <ProfileSettings />
                </ThemeProvider>
            </AuthProvider>
        );

        // Open dialog
        fireEvent.click(screen.getByRole('button'));

        // Change name
        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Name' } });

        // Save
        fireEvent.click(screen.getByText('Save changes'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/users/me', expect.objectContaining({
                method: 'PUT',
                body: expect.stringContaining('New Name'),
            }));
        });
    });
});
