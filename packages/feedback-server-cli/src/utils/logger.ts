/**
 * Logger Utility
 *
 * Provides colored, leveled logging for the CLI.
 */

import chalk from 'chalk';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Logger class for CLI output
 */
class Logger {
  private level: LogLevel = 'info';

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Check if a level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  /**
   * Log a debug message
   */
  debug(message: string): void {
    if (this.shouldLog('debug')) {
      console.log(chalk.gray(`[DEBUG] ${message}`));
    }
  }

  /**
   * Log an info message
   */
  info(message: string): void {
    if (this.shouldLog('info')) {
      console.log(chalk.blue(`ℹ ${message}`));
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string): void {
    if (this.shouldLog('warn')) {
      console.log(chalk.yellow(`⚠ ${message}`));
    }
  }

  /**
   * Log an error message
   */
  error(message: string): void {
    if (this.shouldLog('error')) {
      console.error(chalk.red(`✖ ${message}`));
    }
  }

  /**
   * Log a success message
   */
  success(message: string): void {
    console.log(chalk.green(`✓ ${message}`));
  }
}

// Export singleton instance
export const logger = new Logger();
