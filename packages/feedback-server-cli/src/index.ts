/**
 * Feedback Server CLI
 *
 * Command-line interface for interacting with the Feedback Server API.
 * Enables developers and administrators to manage feedback, export data,
 * and configure the server from the terminal.
 *
 * @packageDocumentation
 */

import { program } from 'commander';
import chalk from 'chalk';
import updateNotifier from 'update-notifier';

import { registerCommands } from './commands/index.js';
import { logger } from './utils/logger.js';
import pkg from '../package.json' with { type: 'json' };

// Check for updates
const notifier = updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 });
notifier.notify({ isGlobal: true });

// Configure the main program
program
  .name('feedback-cli')
  .description('Command-line interface for Feedback Server')
  .version(pkg.version, '-v, --version', 'Output the current version')
  .option('-d, --debug', 'Enable debug mode with verbose logging', false)
  .option('--no-color', 'Disable colored output')
  .option('-o, --output <format>', 'Output format (json|yaml|table)', 'table')
  .option('-s, --server <url>', 'Feedback server URL')
  .configureOutput({
    writeOut: (str) => process.stdout.write(str),
    writeErr: (str) => process.stderr.write(chalk.red(str)),
    outputError: (str, write) => write(chalk.red(str)),
  })
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();

    // Configure logger based on debug flag
    if (options.debug) {
      logger.setLevel('debug');
      logger.debug('Debug mode enabled');
    }

    // Disable colors if requested
    if (options.noColor) {
      chalk.level = 0;
    }
  });

// Register all commands
registerCommands(program);

// Parse arguments and execute
program.parseAsync(process.argv).catch((error: unknown) => {
  if (error instanceof Error) {
    logger.error(error.message);
    if (program.opts().debug) {
      logger.debug(error.stack ?? 'No stack trace available');
    }
  } else {
    logger.error('An unexpected error occurred');
  }
  process.exit(1);
});
