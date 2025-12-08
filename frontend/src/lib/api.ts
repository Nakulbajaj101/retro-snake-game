const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface User {
    id: string;
    username: string;
    display_name?: string;
    avatar?: string;
    theme_preference?: string;
    created_at: string;
}

export interface Score {
    id: string;
    user_id: string;
    username: string;
    display_name?: string;
    avatar?: string;
    score: number;
    created_at: string;
}

export interface UserUpdate {
    display_name?: string;
    avatar?: string;
    theme_preference?: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

class ApiClient {
    private getAuthHeader(): HeadersInit {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async register(username: string, password: string): Promise<User> {
        const url = `${API_BASE_URL}/auth/register`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                let errorMessage = 'Registration failed';
                try {
                    const error = await response.json();
                    errorMessage = error.detail || error.message || errorMessage;
                } catch {
                    errorMessage = `Registration failed: ${response.statusText} (Status: ${response.status})`;
                }
                throw new Error(errorMessage);
            }

            return response.json();
        } catch (error) {
            // Handle network/connection errors
            if (error instanceof TypeError) {
                const isNetworkError = error.message.includes('fetch') ||
                    error.message.includes('network') ||
                    error.message.includes('Failed to fetch') ||
                    error.message.includes('NetworkError') ||
                    error.message === 'Network request failed';

                if (isNetworkError) {
                    console.error('Registration network error:', error);
                    console.error('Attempted URL:', url);
                    throw new Error(
                        `Could not connect to server at ${url}. ` +
                        `Please ensure the backend is running at ${API_BASE_URL.replace('/api', '')}. ` +
                        `Check your browser console for more details.`
                    );
                }
                throw new Error(`Network error: ${error.message}`);
            }

            // Re-throw Error instances as-is (they should have proper messages)
            if (error instanceof Error) {
                throw error;
            }

            // For unknown error types
            throw new Error(`Registration failed: ${String(error)}`);
        }
    }

    async login(username: string, password: string): Promise<LoginResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                let errorMessage = 'Login failed';
                try {
                    const error = await response.json();
                    errorMessage = error.detail || error.message || errorMessage;
                } catch {
                    errorMessage = `Login failed: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            return response.json();
        } catch (error) {
            if (error instanceof TypeError) {
                if (error.message.includes('fetch') || error.message.includes('network')) {
                    throw new Error(`Could not connect to server. Please ensure the backend is running at ${API_BASE_URL.replace('/api', '')}`);
                }
                throw new Error(`Network error: ${error.message}`);
            }
            throw error;
        }
    }

    async getLeaderboard(limit: number = 10): Promise<Score[]> {
        const response = await fetch(`${API_BASE_URL}/scores?limit=${limit}`);

        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard');
        }

        return response.json();
    }

    async submitScore(score: number): Promise<Score> {
        const response = await fetch(`${API_BASE_URL}/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
            },
            body: JSON.stringify({ score }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to submit score');
        }

        return response.json();
    }

    async updateProfile(data: UserUpdate): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            let errorMessage = 'Failed to update profile';
            try {
                const error = await response.json();
                errorMessage = error.detail || errorMessage;
            } catch {
                errorMessage = `Failed to update profile: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        return response.json();
    }
}

export const api = new ApiClient();
