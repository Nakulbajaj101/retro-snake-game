import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import * as apiModule from '@/lib/api';

vi.mock('@/lib/api');

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
    );

    describe('register', () => {
        it('should register a new user and auto-login', async () => {
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

            const { result } = renderHook(() => useAuth(), { wrapper });

            expect(result.current.isAuthenticated).toBe(false);
            expect(result.current.user).toBe(null);

            await act(async () => {
                await result.current.register('newuser', 'ValidP@ssw0rd123');
            });

            await waitFor(() => {
                expect(result.current.isAuthenticated).toBe(true);
            });

            expect(result.current.user).toEqual(mockUser);
            expect(result.current.token).toBe('jwt-token-123');
            expect(localStorage.getItem('token')).toBe('jwt-token-123');
            expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
        });

        it('should throw error if registration fails', async () => {
            vi.spyOn(apiModule.api, 'register').mockRejectedValueOnce(
                new Error('Username already exists')
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await expect(async () => {
                await act(async () => {
                    await result.current.register('existinguser', 'ValidP@ssw0rd123');
                });
            }).rejects.toThrow('Username already exists');

            expect(result.current.isAuthenticated).toBe(false);
            expect(result.current.user).toBe(null);
        });

        it('should throw error if auto-login fails after registration', async () => {
            const mockUser = {
                id: '123',
                username: 'newuser',
                created_at: '2024-01-01T00:00:00Z',
            };

            vi.spyOn(apiModule.api, 'register').mockResolvedValueOnce(mockUser);
            vi.spyOn(apiModule.api, 'login').mockRejectedValueOnce(
                new Error('Login failed')
            );

            const { result } = renderHook(() => useAuth(), { wrapper });

            await expect(async () => {
                await act(async () => {
                    await result.current.register('newuser', 'ValidP@ssw0rd123');
                });
            }).rejects.toThrow('Login failed');

            expect(result.current.isAuthenticated).toBe(false);
        });
    });

    describe('login', () => {
        it('should login successfully and store credentials', async () => {
            const mockResponse = {
                token: 'jwt-token-123',
                user: {
                    id: '123',
                    username: 'testuser',
                    created_at: '2024-01-01T00:00:00Z',
                },
            };

            vi.spyOn(apiModule.api, 'login').mockResolvedValueOnce(mockResponse);

            const { result } = renderHook(() => useAuth(), { wrapper });

            await act(async () => {
                await result.current.login('testuser', 'ValidP@ssw0rd');
            });

            await waitFor(() => {
                expect(result.current.isAuthenticated).toBe(true);
            });

            expect(result.current.user).toEqual(mockResponse.user);
            expect(result.current.token).toBe('jwt-token-123');
            expect(localStorage.getItem('token')).toBe('jwt-token-123');
        });
    });

    describe('logout', () => {
        it('should clear user data and localStorage', async () => {
            const mockResponse = {
                token: 'jwt-token-123',
                user: {
                    id: '123',
                    username: 'testuser',
                    created_at: '2024-01-01T00:00:00Z',
                },
            };

            vi.spyOn(apiModule.api, 'login').mockResolvedValueOnce(mockResponse);

            const { result } = renderHook(() => useAuth(), { wrapper });

            await act(async () => {
                await result.current.login('testuser', 'ValidP@ssw0rd');
            });

            await waitFor(() => {
                expect(result.current.isAuthenticated).toBe(true);
            });

            act(() => {
                result.current.logout();
            });

            expect(result.current.isAuthenticated).toBe(false);
            expect(result.current.user).toBe(null);
            expect(result.current.token).toBe(null);
            expect(localStorage.getItem('token')).toBe(null);
            expect(localStorage.getItem('user')).toBe(null);
        });
    });

    describe('initialization', () => {
        it('should restore session from localStorage on mount', () => {
            const mockUser = {
                id: '123',
                username: 'testuser',
                created_at: '2024-01-01T00:00:00Z',
            };

            localStorage.setItem('token', 'stored-token');
            localStorage.setItem('user', JSON.stringify(mockUser));

            const { result } = renderHook(() => useAuth(), { wrapper });

            expect(result.current.isAuthenticated).toBe(true);
            expect(result.current.user).toEqual(mockUser);
            expect(result.current.token).toBe('stored-token');
        });
    });
});
