import { PrismaClient } from '@prisma/client';
import { createOAuthClient } from './auth';
import { vi } from 'vitest';
import type { TestUser } from '../types';

export async function createTestUser(email = 'test@example.com'): Promise<TestUser> {
  const prisma = new PrismaClient();
  
  try {
    // Try to find existing user first
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return {
        id: existingUser.id,
        email: existingUser.email,
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token'
      };
    }
    
    // Create user in database if it doesn't exist
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Test User',
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        tokenExpiry: new Date(Date.now() + 3600 * 1000)
      }
    });
    
    return {
      id: user.id,
      email: user.email,
      accessToken: 'test_access_token',
      refreshToken: 'test_refresh_token'
    };
  } finally {
    await prisma.$disconnect();
  }
}

export function createMockAuthClient() {
  // Create a mock client with a state variable to track logout status
  let isLoggedOut = false;
  
  return {
    getAuthUrl: vi.fn().mockResolvedValue(new URL('https://accounts.google.com/o/oauth2/v2/auth')),
    handleCallback: vi.fn().mockResolvedValue({
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expires_in: 3600
    }),
    refreshToken: vi.fn().mockImplementation((token: string) => {
      if (token === 'invalid_token') {
        return Promise.reject(new Error('Invalid refresh token'));
      }
      return Promise.resolve({
        access_token: 'new_mock_access_token',
        expires_in: 3600
      });
    }),
    createSession: vi.fn().mockResolvedValue({
      token: 'mock_session_token'
    }),
    validateSession: vi.fn().mockImplementation((token: string) => {
      // Check if the token has been logged out
      if (token === 'mock_session_token' && isLoggedOut) {
        return Promise.resolve(false);
      }
      return Promise.resolve(true);
    }),
    logout: vi.fn().mockImplementation((token: string) => {
      isLoggedOut = true;
      return Promise.resolve(true);
    }),
    cleanup: vi.fn().mockResolvedValue(true)
  };
}
