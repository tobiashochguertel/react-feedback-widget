/**
 * Configuration Commands
 *
 * Commands for managing CLI configuration.
 * - init: Interactive configuration setup
 * - get: Get a config value
 * - set: Set a config value
 * - list: Show all configuration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import Table from 'cli-table3';

import { configManager, type ConfigKey } from '../lib/config.js';
import { logger } from '../utils/logger.js';

/**
 * Register config commands with the CLI
 */
export function registerConfigCommand(program: Command): void {
  const config = program
    .command('config')
    .description('Manage CLI configuration');

  // config init
  config
    .command('init')
    .description('Initialize configuration interactively')
    .action(async () => {
      console.log(chalk.bold('\n  Feedback CLI Configuration\n'));

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'serverUrl',
          message: 'Feedback Server URL:',
          default: configManager.get('serverUrl') ?? 'http://localhost:3000',
          validate: (input: string) => {
            try {
              new URL(input);
              return true;
            } catch {
              return 'Please enter a valid URL';
            }
          },
        },
        {
          type: 'list',
          name: 'defaultOutputFormat',
          message: 'Default output format:',
          choices: ['table', 'json', 'yaml'],
          default: configManager.get('defaultOutputFormat') ?? 'table',
        },
        {
          type: 'number',
          name: 'defaultPageSize',
          message: 'Default page size for listings:',
          default: configManager.get('defaultPageSize') ?? 20,
          validate: (input: number) => input > 0 && input <= 100 || 'Must be between 1 and 100',
        },
        {
          type: 'confirm',
          name: 'colorOutput',
          message: 'Enable colored output?',
          default: configManager.get('colorOutput') ?? true,
        },
      ]);

      configManager.set('serverUrl', answers.serverUrl);
      configManager.set('defaultOutputFormat', answers.defaultOutputFormat);
      configManager.set('defaultPageSize', answers.defaultPageSize);
      configManager.set('colorOutput', answers.colorOutput);

      console.log(chalk.green('\n  ✓ Configuration saved!\n'));
      console.log(chalk.dim(`  Config file: ${configManager.getPath()}\n`));
    });

  // config get
  config
    .command('get <key>')
    .description('Get a configuration value')
    .action((key: string) => {
      const value = configManager.get(key as ConfigKey);

      if (value === undefined) {
        logger.error(`Configuration key "${key}" is not set`);
        process.exit(1);
      }

      console.log(value);
    });

  // config set
  config
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action((key: string, value: string) => {
      try {
        // Parse value (handle booleans and numbers)
        let parsedValue: string | number | boolean = value;

        if (value === 'true') parsedValue = true;
        else if (value === 'false') parsedValue = false;
        else if (!isNaN(Number(value))) parsedValue = Number(value);

        configManager.set(key as ConfigKey, parsedValue as Parameters<typeof configManager.set>[1]);

        console.log(chalk.green(`✓ Set ${key} = ${String(parsedValue)}`));
      } catch (error) {
        if (error instanceof Error) {
          logger.error(error.message);
        }
        process.exit(1);
      }
    });

  // config list
  config
    .command('list')
    .alias('ls')
    .description('Show all configuration values')
    .option('-o, --output <format>', 'Output format (json|table)', 'table')
    .action((options) => {
      const all = configManager.getAll();

      if (options.output === 'json') {
        console.log(JSON.stringify(all, null, 2));
        return;
      }

      const table = new Table({
        head: [chalk.bold('Key'), chalk.bold('Value')],
        colWidths: [25, 50],
      });

      for (const [key, value] of Object.entries(all)) {
        table.push([key, String(value)]);
      }

      console.log();
      console.log(table.toString());
      console.log(chalk.dim(`\nConfig file: ${configManager.getPath()}`));
      console.log();
    });

  // config reset
  config
    .command('reset')
    .description('Reset configuration to defaults')
    .option('-f, --force', 'Skip confirmation')
    .action(async (options) => {
      if (!options.force) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Reset all configuration to defaults?',
            default: false,
          },
        ]);

        if (!confirm) {
          logger.info('Cancelled');
          return;
        }
      }

      configManager.reset();
      console.log(chalk.green('✓ Configuration reset to defaults'));
    });
}
