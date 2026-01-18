/**
 * Authentication Manager
 *
 * Handles authentication with the Feedback Server.
 * Stores credentials securely using the system keychain (via keytar).
 */

import keytar from 'keytar';

import { configManager } from './config.js';
import { logger } from '../utils/logger.js';

const SERVICE_NAME = 'feedback-cli';
const ACCOUNT_TOKEN = 'auth-token';
const ACCOUNT_API_KEY = 'api-key';

/**
 * User info returned after login
 */
interface UserInfo {
  email: string;
  role?: string;
}

/**
 * Current authentication state
 */
interface AuthState {
  email: string;
  serverUrl: string;
  role?: string | undefined;
}

/**
 * Authentication Manager class
 */
class AuthManager {
  /**
   * Login with username and password
   */
  async login(serverUrl: string, username: string, password: string): Promise<UserInfo> {
    // Make login request to server
    const response = await fetch(`${serverUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error(String(error.message ?? 'Login failed'));
    }

    const data = await response.json() as {
      token: string;
      user: { email: string; role?: string };
    };

    // Store token securely
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_TOKEN, data.token);

    // Store server URL and user info in config
    configManager.set('serverUrl', serverUrl);
    configManager.set('userEmail', data.user.email);
    if (data.user.role) {
      configManager.set('userRole', data.user.role);
    }

    logger.debug(`Stored token for ${data.user.email}`);

    return data.user;
  }

  /**
   * Login with API key
   */
  async loginWithApiKey(serverUrl: string, apiKey: string): Promise<void> {
    // Validate API key by making a test request
    const response = await fetch(`${serverUrl}/api/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Invalid API key');
    }

    const data = await response.json() as { user?: { email: string } };

    // Store API key securely
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_API_KEY, apiKey);

    // Store server URL in config
    configManager.set('serverUrl', serverUrl);
    if (data.user?.email) {
      configManager.set('userEmail', data.user.email);
    }

    logger.debug('Stored API key');
  }

  /**
   * Logout and clear credentials
   */
  async logout(): Promise<void> {
    // Remove token from keychain
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_TOKEN);
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_API_KEY);

    // Clear user info from config
    configManager.delete('userEmail');
    configManager.delete('userRole');

    logger.debug('Cleared stored credentials');
  }

  /**
   * Get the current authentication token
   */
  async getToken(): Promise<string | null> {
    // Check environment variable first
    if (process.env.FEEDBACK_API_KEY) {
      return process.env.FEEDBACK_API_KEY;
    }

    // Check for stored API key
    const apiKey = await keytar.getPassword(SERVICE_NAME, ACCOUNT_API_KEY);
    if (apiKey) {
      return apiKey;
    }

    // Check for stored token
    const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_TOKEN);
    return token;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  /**
   * Get current authentication state
   */
  async getCurrentAuth(): Promise<AuthState | null> {
    const token = await this.getToken();

    if (!token) {
      return null;
    }

    const email = configManager.get('userEmail');
    const serverUrl = configManager.get('serverUrl');
    const role = configManager.get('userRole');

    if (!email || !serverUrl) {
      return null;
    }

    return {
      email,
      serverUrl,
      role,
    };
  }
}

// Export singleton instance
export const authManager = new AuthManager();
