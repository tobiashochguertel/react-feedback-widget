/**
 * Command Registry
 *
 * Registers all CLI commands with the main program.
 */

import { Command } from 'commander';

import { registerAuthCommand } from './auth.js';
import { registerFeedbackCommand } from './feedback.js';
import { registerConfigCommand } from './config.js';
import { registerExportCommand } from './export.js';
import { registerStatsCommand } from './stats.js';

/**
 * Register all commands with the CLI program
 * @param program - The Commander.js program instance
 */
export function registerCommands(program: Command): void {
  registerAuthCommand(program);
  registerFeedbackCommand(program);
  registerConfigCommand(program);
  registerExportCommand(program);
  registerStatsCommand(program);
}
