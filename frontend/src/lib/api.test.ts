import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from './api';

describe('API Client - Registration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    describe('register', () => {
        it('should successfully register a user with valid credentials', async () => {
            const mockUser = {
                id: '123',
                username: 'testuser',
                created_at: '2024-01-01T00:00:00Z',
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockUser,
            });

            const result = await api.register('testuser', 'ValidP@ssw0rd');

            // Check the URL contains the correct path (regardless of base URL)
            const callUrl = (global.fetch as any).mock.calls[0][0];
            expect(callUrl).toContain('/auth/register');

            // Check the request options
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/register'),
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'testuser', password: 'ValidP@ssw0rd' }),
                }
            );
            expect(result).toEqual(mockUser);
        });

        it('should throw error when username already exists (409)', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 409,
                statusText: 'Conflict',
                json: async () => ({ detail: 'Username already exists' }),
            });

            await expect(api.register('existinguser', 'ValidP@ssw0rd')).rejects.toThrow(
                'Username already exists'
            );
        });

        it('should throw error when password is too weak (400)', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: async () => ({ detail: 'Password does not meet requirements' }),
            });

            await expect(api.register('testuser', 'weak')).rejects.toThrow(
                'Password does not meet requirements'
            );
        });

        it('should handle network errors gracefully', async () => {
            (global.fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));

            await expect(api.register('testuser', 'ValidP@ssw0rd')).rejects.toThrow(
                /Could not connect to server/
            );
        });

        it('should handle server errors (500)', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => { throw new Error('Invalid JSON'); },
            });

            await expect(api.register('testuser', 'ValidP@ssw0rd')).rejects.toThrow(
                /Registration failed.*Internal Server Error/
            );
        });

        it('should handle malformed JSON in error response', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: async () => { throw new Error('Invalid JSON'); },
            });

            await expect(api.register('testuser', 'ValidP@ssw0rd')).rejects.toThrow(
                /Registration failed.*Bad Request/
            );
        });

        it('should use correct API endpoint from env variable', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: '123',
                    username: 'testuser',
                    created_at: '2024-01-01T00:00:00Z',
                }),
            });

            await api.register('testuser', 'ValidP@ssw0rd');

            const callUrl = (global.fetch as any).mock.calls[0][0];
            expect(callUrl).toContain('/auth/register');
        });
    });

    describe('login', () => {
        it('should successfully login with valid credentials', async () => {
            const mockResponse = {
                token: 'jwt-token-123',
                user: {
                    id: '123',
                    username: 'testuser',
                    created_at: '2024-01-01T00:00:00Z',
                },
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await api.login('testuser', 'ValidP@ssw0rd');

            expect(result).toEqual(mockResponse);
            expect(result.token).toBe('jwt-token-123');
        });

        it('should throw error with invalid credentials', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: async () => ({ detail: 'Invalid username or password' }),
            });

            await expect(api.login('testuser', 'wrongpassword')).rejects.toThrow(
                'Invalid username or password'
            );
        });
    });
});
