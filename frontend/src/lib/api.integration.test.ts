import { describe, it, expect, beforeAll } from 'vitest';
import { api } from './api';

describe('API Integration Tests - Registration', () => {
    const testUsername = `testuser_${Date.now()}`;
    const testPassword = 'TestP@ssw0rd123';

    beforeAll(() => {
        console.log('Running integration tests against backend at:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api');
        console.log('Test username:', testUsername);
    });

    it('should register a new user successfully', async () => {
        const user = await api.register(testUsername, testPassword);

        expect(user).toBeDefined();
        expect(user.username).toBe(testUsername);
        expect(user.id).toBeDefined();
        expect(user.created_at).toBeDefined();
    }, 10000);

    it('should login with the newly registered user', async () => {
        const response = await api.login(testUsername, testPassword);

        expect(response).toBeDefined();
        expect(response.token).toBeDefined();
        expect(response.user).toBeDefined();
        expect(response.user.username).toBe(testUsername);
    }, 10000);

    it('should reject duplicate username registration', async () => {
        await expect(api.register(testUsername, testPassword)).rejects.toThrow(
            /already exists/i
        );
    }, 10000);

    it('should reject weak passwords', async () => {
        const uniqueUsername = `testuser_${Date.now()}_weak`;

        await expect(api.register(uniqueUsername, 'weak')).rejects.toThrow();
    }, 10000);

    it('should reject invalid login credentials', async () => {
        await expect(api.login(testUsername, 'wrongpassword')).rejects.toThrow(
            /invalid/i
        );
    }, 10000);

    it('should reject login with non-existent user', async () => {
        await expect(api.login('nonexistentuser_99999', testPassword)).rejects.toThrow();
    }, 10000);
});
