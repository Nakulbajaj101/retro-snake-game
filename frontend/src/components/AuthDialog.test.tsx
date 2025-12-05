import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthDialog } from './AuthDialog';
import { AuthProvider } from '@/contexts/AuthContext';
import * as apiModule from '@/lib/api';

vi.mock('@/lib/api');

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: mockToast }),
}));

describe('AuthDialog - Registration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        mockToast.mockClear();
    });

    const renderAuthDialog = () => {
        return render(
            <AuthProvider>
                <AuthDialog>
                    <button>Open Auth</button>
                </AuthDialog>
            </AuthProvider>
        );
    };

    it('should render registration form when switched to register mode', async () => {
        const user = userEvent.setup();
        renderAuthDialog();

        await user.click(screen.getByText('Open Auth'));

        expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();

        await user.click(screen.getByText("Don't have an account? Register"));

        expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
        expect(screen.getByText('Create a new account to save your scores')).toBeInTheDocument();
    });

    it('should successfully register a new user with valid credentials', async () => {
        const user = userEvent.setup();
        const mockUser = {
            id: '123',
            username: 'newuser',
            created_at: '2024-01-01T00:00:00Z',
        };

        const mockLoginResponse = {
            token: 'jwt-token-123',
            user: mockUser,
        };

        vi.spyOn(apiModule.api, 'register').mockResolvedValueOnce(mockUser);
        vi.spyOn(apiModule.api, 'login').mockResolvedValueOnce(mockLoginResponse);

        renderAuthDialog();

        await user.click(screen.getByText('Open Auth'));
        await user.click(screen.getByText("Don't have an account? Register"));

        const usernameInput = screen.getByLabelText('Username');
        const passwordInput = screen.getByLabelText('Password');

        await user.type(usernameInput, 'newuser');
        await user.type(passwordInput, 'ValidP@ssw0rd123');

        await user.click(screen.getByRole('button', { name: 'Register' }));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith({
                title: 'Success',
                description: 'Account created and logged in!',
            });
        });

        expect(apiModule.api.register).toHaveBeenCalledWith('newuser', 'ValidP@ssw0rd123');
    });

    it('should show password strength indicator for registration', async () => {
        const user = userEvent.setup();
        renderAuthDialog();

        await user.click(screen.getByText('Open Auth'));
        await user.click(screen.getByText("Don't have an account? Register"));

        const passwordInput = screen.getByLabelText('Password');

        await user.type(passwordInput, 'weak');

        await waitFor(() => {
            expect(screen.getByText('Password Strength:')).toBeInTheDocument();
        });
    });

    it('should prevent registration with weak password', async () => {
        const user = userEvent.setup();
        renderAuthDialog();

        await user.click(screen.getByText('Open Auth'));
        await user.click(screen.getByText("Don't have an account? Register"));

        const usernameInput = screen.getByLabelText('Username');
        const passwordInput = screen.getByLabelText('Password');

        await user.type(usernameInput, 'testuser');
        await user.type(passwordInput, 'weak');

        await user.click(screen.getByRole('button', { name: 'Register' }));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith({
                title: 'Weak Password',
                description: 'Please choose a stronger password. See suggestions below.',
                variant: 'destructive',
            });
        });

        expect(apiModule.api.register).not.toHaveBeenCalled();
    });

    it('should show error when username already exists', async () => {
        const user = userEvent.setup();
        vi.spyOn(apiModule.api, 'register').mockRejectedValueOnce(
            new Error('Username already exists')
        );

        renderAuthDialog();

        await user.click(screen.getByText('Open Auth'));
        await user.click(screen.getByText("Don't have an account? Register"));

        const usernameInput = screen.getByLabelText('Username');
        const passwordInput = screen.getByLabelText('Password');

        await user.type(usernameInput, 'existinguser');
        await user.type(passwordInput, 'ValidP@ssw0rd123');

        await user.click(screen.getByRole('button', { name: 'Register' }));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith({
                title: 'Error',
                description: 'Username already exists',
                variant: 'destructive',
            });
        });
    });

    it('should show error when backend is unreachable', async () => {
        const user = userEvent.setup();
        vi.spyOn(apiModule.api, 'register').mockRejectedValueOnce(
            new Error('Could not connect to server at http://localhost:3000/api/auth/register. Please ensure the backend is running at http://localhost:3000.')
        );

        renderAuthDialog();

        await user.click(screen.getByText('Open Auth'));
        await user.click(screen.getByText("Don't have an account? Register"));

        const usernameInput = screen.getByLabelText('Username');
        const passwordInput = screen.getByLabelText('Password');

        await user.type(usernameInput, 'testuser');
        await user.type(passwordInput, 'ValidP@ssw0rd123');

        await user.click(screen.getByRole('button', { name: 'Register' }));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Error',
                    description: expect.stringContaining('Could not connect to server'),
                    variant: 'destructive',
                })
            );
        });
    });

    it('should require minimum username length', async () => {
        const user = userEvent.setup();
        renderAuthDialog();

        await user.click(screen.getByText('Open Auth'));
        await user.click(screen.getByText("Don't have an account? Register"));

        const usernameInput = screen.getByLabelText('Username');
        expect(usernameInput).toHaveAttribute('minLength', '3');
    });

    it('should require minimum password length', async () => {
        const user = userEvent.setup();
        renderAuthDialog();

        await user.click(screen.getByText('Open Auth'));
        await user.click(screen.getByText("Don't have an account? Register"));

        const passwordInput = screen.getByLabelText('Password');
        expect(passwordInput).toHaveAttribute('minLength', '8');
    });

    it('should display password requirements in registration mode', async () => {
        const user = userEvent.setup();
        renderAuthDialog();

        await user.click(screen.getByText('Open Auth'));
        await user.click(screen.getByText("Don't have an account? Register"));

        expect(screen.getByText('Password Requirements:')).toBeInTheDocument();
        expect(screen.getByText('At least 8 characters long')).toBeInTheDocument();
        expect(screen.getByText('Contains uppercase and lowercase letters')).toBeInTheDocument();
        expect(screen.getByText('Contains at least one number')).toBeInTheDocument();
    });

    it('should close dialog after successful registration', async () => {
        const user = userEvent.setup();
        const mockUser = {
            id: '123',
            username: 'newuser',
            created_at: '2024-01-01T00:00:00Z',
        };

        const mockLoginResponse = {
            token: 'jwt-token-123',
            user: mockUser,
        };

        vi.spyOn(apiModule.api, 'register').mockResolvedValueOnce(mockUser);
        vi.spyOn(apiModule.api, 'login').mockResolvedValueOnce(mockLoginResponse);

        renderAuthDialog();

        await user.click(screen.getByText('Open Auth'));
        await user.click(screen.getByText("Don't have an account? Register"));

        const usernameInput = screen.getByLabelText('Username');
        const passwordInput = screen.getByLabelText('Password');

        await user.type(usernameInput, 'newuser');
        await user.type(passwordInput, 'ValidP@ssw0rd123');

        await user.click(screen.getByRole('button', { name: 'Register' }));

        await waitFor(() => {
            expect(screen.queryByText('Register')).not.toBeInTheDocument();
        });
    });
});
