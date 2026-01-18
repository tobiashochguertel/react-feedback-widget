/**
 * Configuration Manager
 *
 * Manages CLI configuration using the `conf` library.
 * Configuration is stored in a platform-appropriate location.
 */

import Conf from 'conf';

/**
 * Configuration schema with typed keys
 */
interface ConfigSchema {
  // Server settings
  serverUrl: string;
  requestTimeout: number;
  maxRetries: number;

  // Display settings
  defaultOutputFormat: 'table' | 'json' | 'yaml';
  defaultPageSize: number;
  colorOutput: boolean;

  // User info (from auth)
  userEmail?: string;
  userRole?: string;
}

/**
 * Default configuration values
 */
const defaults: ConfigSchema = {
  serverUrl: 'http://localhost:3000',
  requestTimeout: 30000,
  maxRetries: 3,
  defaultOutputFormat: 'table',
  defaultPageSize: 20,
  colorOutput: true,
};

/**
 * Valid configuration keys
 */
export type ConfigKey = keyof ConfigSchema;

/**
 * Configuration Manager class
 */
class ConfigManager {
  private conf: Conf<ConfigSchema>;

  constructor() {
    this.conf = new Conf<ConfigSchema>({
      projectName: 'feedback-cli',
      defaults,
      schema: {
        serverUrl: {
          type: 'string',
          format: 'uri',
        },
        requestTimeout: {
          type: 'number',
          minimum: 1000,
          maximum: 300000,
        },
        maxRetries: {
          type: 'number',
          minimum: 0,
          maximum: 10,
        },
        defaultOutputFormat: {
          type: 'string',
          enum: ['table', 'json', 'yaml'],
        },
        defaultPageSize: {
          type: 'number',
          minimum: 1,
          maximum: 100,
        },
        colorOutput: {
          type: 'boolean',
        },
        userEmail: {
          type: 'string',
        },
        userRole: {
          type: 'string',
        },
      },
    });
  }

  /**
   * Get a configuration value
   */
  get<K extends ConfigKey>(key: K): ConfigSchema[K] | undefined {
    return this.conf.get(key);
  }

  /**
   * Set a configuration value
   */
  set<K extends ConfigKey>(key: K, value: ConfigSchema[K]): void {
    this.conf.set(key, value);
  }

  /**
   * Delete a configuration value
   */
  delete(key: ConfigKey): void {
    this.conf.delete(key);
  }

  /**
   * Check if a key exists
   */
  has(key: ConfigKey): boolean {
    return this.conf.has(key);
  }

  /**
   * Get all configuration values
   */
  getAll(): ConfigSchema {
    return this.conf.store;
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.conf.clear();
    for (const [key, value] of Object.entries(defaults)) {
      this.conf.set(key as ConfigKey, value);
    }
  }

  /**
   * Get the path to the config file
   */
  getPath(): string {
    return this.conf.path;
  }
}

// Export singleton instance
export const configManager = new ConfigManager();
