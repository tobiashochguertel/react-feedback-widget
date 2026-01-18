/**
 * Authentication Commands
 *
 * Commands for managing authentication with the Feedback Server.
 * - login: Authenticate with username/password or API key
 * - logout: Clear stored credentials
 * - whoami: Show current authenticated user
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';

import { authManager } from '../lib/auth.js';
import { configManager } from '../lib/config.js';
import { logger } from '../utils/logger.js';

/**
 * Register auth commands with the CLI
 */
export function registerAuthCommand(program: Command): void {
  const auth = program
    .command('auth')
    .description('Manage authentication with Feedback Server');

  // auth login
  auth
    .command('login')
    .description('Authenticate with Feedback Server')
    .option('-k, --api-key <key>', 'API key for authentication')
    .option('-u, --username <username>', 'Username for authentication')
    .option('-p, --password <password>', 'Password for authentication')
    .option('-s, --server <url>', 'Server URL')
    .action(async (options) => {
      const spinner = ora();

      try {
        // Get server URL
        let serverUrl = options.server ?? program.opts().server;
        if (!serverUrl) {
          serverUrl = configManager.get('serverUrl');
        }

        if (!serverUrl) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'serverUrl',
              message: 'Enter Feedback Server URL:',
              default: 'http://localhost:3000',
              validate: (input: string) => {
                try {
                  new URL(input);
                  return true;
                } catch {
                  return 'Please enter a valid URL';
                }
              },
            },
          ]);
          serverUrl = answers.serverUrl;
        }

        // Check if using API key
        if (options.apiKey) {
          spinner.start('Validating API key...');

          await authManager.loginWithApiKey(serverUrl, options.apiKey);

          spinner.succeed(chalk.green('Successfully authenticated with API key'));
          return;
        }

        // Interactive login
        let username = options.username;
        let password = options.password;

        if (!username || !password) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'username',
              message: 'Username:',
              when: !username,
            },
            {
              type: 'password',
              name: 'password',
              message: 'Password:',
              mask: '*',
              when: !password,
            },
          ]);

          username = username ?? answers.username;
          password = password ?? answers.password;
        }

        spinner.start('Authenticating...');

        const user = await authManager.login(serverUrl, username, password);

        spinner.succeed(chalk.green(`Successfully logged in as ${chalk.bold(user.email)}`));

        logger.info(`Server: ${serverUrl}`);
      } catch (error) {
        spinner.fail(chalk.red('Authentication failed'));
        if (error instanceof Error) {
          logger.error(error.message);
        }
        process.exit(1);
      }
    });

  // auth logout
  auth
    .command('logout')
    .description('Log out and clear stored credentials')
    .action(async () => {
      const spinner = ora('Logging out...').start();

      try {
        await authManager.logout();
        spinner.succeed(chalk.green('Successfully logged out'));
      } catch (error) {
        spinner.fail(chalk.red('Failed to log out'));
        if (error instanceof Error) {
          logger.error(error.message);
        }
        process.exit(1);
      }
    });

  // auth whoami
  auth
    .command('whoami')
    .description('Show current authenticated user')
    .action(async () => {
      const spinner = ora('Checking authentication...').start();

      try {
        const auth = await authManager.getCurrentAuth();

        if (!auth) {
          spinner.info(chalk.yellow('Not logged in'));
          logger.info('Run "feedback-cli auth login" to authenticate');
          return;
        }

        spinner.stop();

        console.log();
        console.log(chalk.bold('  Current User'));
        console.log(chalk.dim('  ────────────────────────────'));
        console.log(`  ${chalk.dim('Email:')}    ${auth.email}`);
        console.log(`  ${chalk.dim('Server:')}   ${auth.serverUrl}`);
        if (auth.role) {
          console.log(`  ${chalk.dim('Role:')}     ${auth.role}`);
        }
        console.log();
      } catch (error) {
        spinner.fail(chalk.red('Failed to get authentication info'));
        if (error instanceof Error) {
          logger.error(error.message);
        }
        process.exit(1);
      }
    });
}
