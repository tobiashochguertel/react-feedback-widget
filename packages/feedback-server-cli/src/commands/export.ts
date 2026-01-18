/**
 * Export Commands
 *
 * Commands for exporting feedback data.
 * - export json: Export to JSON format
 * - export csv: Export to CSV format
 * - export markdown: Export to Markdown format
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { apiClient } from '../lib/api.js';
import { exportToJson, exportToCsv, exportToMarkdown } from '../lib/export.js';
import { logger } from '../utils/logger.js';

/**
 * Register export commands with the CLI
 */
export function registerExportCommand(program: Command): void {
  const exportCmd = program
    .command('export')
    .description('Export feedback data');

  // export json
  exportCmd
    .command('json')
    .description('Export feedback to JSON format')
    .argument('[output]', 'Output file path', 'feedback-export.json')
    .option('-s, --status <status>', 'Filter by status')
    .option('-t, --type <type>', 'Filter by type')
    .option('--from <date>', 'Filter by start date (YYYY-MM-DD)')
    .option('--to <date>', 'Filter by end date (YYYY-MM-DD)')
    .option('--include-media', 'Include media as base64')
    .option('-f, --force', 'Overwrite existing file without confirmation')
    .action(async (output: string, options) => {
      await exportData('json', output, options);
    });

  // export csv
  exportCmd
    .command('csv')
    .description('Export feedback to CSV format')
    .argument('[output]', 'Output file path', 'feedback-export.csv')
    .option('-s, --status <status>', 'Filter by status')
    .option('-t, --type <type>', 'Filter by type')
    .option('--from <date>', 'Filter by start date (YYYY-MM-DD)')
    .option('--to <date>', 'Filter by end date (YYYY-MM-DD)')
    .option('-f, --force', 'Overwrite existing file without confirmation')
    .action(async (output: string, options) => {
      await exportData('csv', output, options);
    });

  // export markdown
  exportCmd
    .command('markdown')
    .alias('md')
    .description('Export feedback to Markdown format')
    .argument('[output]', 'Output file path', 'feedback-export.md')
    .option('-s, --status <status>', 'Filter by status')
    .option('-t, --type <type>', 'Filter by type')
    .option('--from <date>', 'Filter by start date (YYYY-MM-DD)')
    .option('--to <date>', 'Filter by end date (YYYY-MM-DD)')
    .option('-f, --force', 'Overwrite existing file without confirmation')
    .action(async (output: string, options) => {
      await exportData('markdown', output, options);
    });
}

async function exportData(
  format: 'json' | 'csv' | 'markdown',
  outputPath: string,
  options: {
    status?: string;
    type?: string;
    from?: string;
    to?: string;
    includeMedia?: boolean;
    force?: boolean;
  }
): Promise<void> {
  // Check if file exists
  const fullPath = path.resolve(outputPath);

  if (existsSync(fullPath) && !options.force) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `File "${outputPath}" already exists. Overwrite?`,
        default: false,
      },
    ]);

    if (!confirm) {
      logger.info('Export cancelled');
      return;
    }
  }

  const spinner = ora('Fetching feedback...').start();

  try {
    // Fetch all feedback with filters
    const response = await apiClient.listFeedback({
      status: options.status as 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | undefined,
      type: options.type as 'bug' | 'feature' | 'improvement' | 'question' | undefined,
      fromDate: options.from,
      toDate: options.to,
      limit: 1000, // Get all for export
    });

    spinner.text = `Exporting ${response.items.length} items...`;

    let content: string;

    switch (format) {
      case 'json':
        content = await exportToJson(response.items, options.includeMedia);
        break;
      case 'csv':
        content = await exportToCsv(response.items);
        break;
      case 'markdown':
        content = await exportToMarkdown(response.items);
        break;
    }

    await writeFile(fullPath, content, 'utf-8');

    spinner.succeed(
      chalk.green(
        `Exported ${response.items.length} items to ${chalk.bold(outputPath)}`
      )
    );
  } catch (error) {
    spinner.fail(chalk.red('Export failed'));
    if (error instanceof Error) {
      logger.error(error.message);
    }
    process.exit(1);
  }
}
