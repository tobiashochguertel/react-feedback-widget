/**
 * Feedback Commands
 *
 * CRUD operations for feedback items.
 * - list: List feedback with filtering and pagination
 * - get: Get detailed information about a feedback item
 * - create: Create a new feedback item
 * - update: Update an existing feedback item
 * - delete: Delete a feedback item
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import { format } from 'date-fns';

import { apiClient } from '../lib/api.js';
import { formatOutput } from '../lib/output.js';
import { logger } from '../utils/logger.js';
import type { Feedback, FeedbackStatus, FeedbackType, FeedbackPriority } from '../types/index.js';

/**
 * Register feedback commands with the CLI
 */
export function registerFeedbackCommand(program: Command): void {
  const feedback = program
    .command('feedback')
    .alias('fb')
    .description('Manage feedback items');

  // feedback list
  feedback
    .command('list')
    .alias('ls')
    .description('List feedback items')
    .option('-s, --status <status>', 'Filter by status (new|acknowledged|in_progress|resolved|closed)')
    .option('-t, --type <type>', 'Filter by type (bug|feature|improvement|question)')
    .option('-p, --priority <priority>', 'Filter by priority (low|medium|high|critical)')
    .option('--from <date>', 'Filter by start date (YYYY-MM-DD)')
    .option('--to <date>', 'Filter by end date (YYYY-MM-DD)')
    .option('-l, --limit <number>', 'Maximum number of items', '20')
    .option('--offset <number>', 'Offset for pagination', '0')
    .option('-o, --output <format>', 'Output format (json|yaml|table)', 'table')
    .action(async (options) => {
      const spinner = ora('Fetching feedback...').start();

      try {
        const response = await apiClient.listFeedback({
          status: options.status as FeedbackStatus | undefined,
          type: options.type as FeedbackType | undefined,
          priority: options.priority as FeedbackPriority | undefined,
          fromDate: options.from,
          toDate: options.to,
          limit: parseInt(options.limit, 10),
          offset: parseInt(options.offset, 10),
        });

        spinner.stop();

        if (response.data.length === 0) {
          logger.info('No feedback items found');
          return;
        }

        const outputFormat = options.output ?? program.opts().output ?? 'table';

        if (outputFormat === 'table') {
          const table = new Table({
            head: [
              chalk.bold('ID'),
              chalk.bold('Title'),
              chalk.bold('Type'),
              chalk.bold('Status'),
              chalk.bold('Priority'),
              chalk.bold('Created'),
            ],
            colWidths: [10, 40, 12, 14, 10, 12],
          });

          for (const item of response.data) {
            table.push([
              item.id.slice(0, 8),
              truncate(item.title, 38),
              formatType(item.type),
              formatStatus(item.status),
              formatPriority(item.priority),
              format(new Date(item.createdAt), 'MM/dd/yyyy'),
            ]);
          }

          console.log(table.toString());
          console.log(chalk.dim(`\nShowing ${response.data.length} of ${response.total} items`));
        } else {
          console.log(formatOutput(response.data, outputFormat));
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch feedback'));
        if (error instanceof Error) {
          logger.error(error.message);
        }
        process.exit(1);
      }
    });

  // feedback get
  feedback
    .command('get <id>')
    .description('Get detailed information about a feedback item')
    .option('-o, --output <format>', 'Output format (json|yaml|table)', 'table')
    .option('--include-media', 'Include media information')
    .action(async (id: string, options) => {
      const spinner = ora('Fetching feedback...').start();

      try {
        const item = await apiClient.getFeedback(id);

        spinner.stop();

        const outputFormat = options.output ?? program.opts().output ?? 'table';

        if (outputFormat === 'table') {
          displayFeedbackDetails(item);
        } else {
          console.log(formatOutput(item, outputFormat));
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch feedback'));
        if (error instanceof Error) {
          logger.error(error.message);
        }
        process.exit(1);
      }
    });

  // feedback create
  feedback
    .command('create')
    .description('Create a new feedback item')
    .option('-t, --title <title>', 'Feedback title')
    .option('-d, --description <description>', 'Feedback description')
    .option('--type <type>', 'Feedback type (bug|feature|improvement|question)')
    .option('--priority <priority>', 'Priority (low|medium|high|critical)')
    .option('-i, --interactive', 'Interactive mode')
    .option('-f, --file <path>', 'Create from JSON file')
    .action(async (options) => {
      try {
        let feedbackData: Partial<Feedback>;

        if (options.file) {
          // TODO: Load from file
          throw new Error('File input not yet implemented');
        } else if (options.interactive || !options.title) {
          // Interactive mode
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'title',
              message: 'Title:',
              validate: (input: string) => input.length > 0 || 'Title is required',
            },
            {
              type: 'editor',
              name: 'description',
              message: 'Description:',
            },
            {
              type: 'list',
              name: 'type',
              message: 'Type:',
              choices: ['bug', 'feature', 'improvement', 'question'],
            },
            {
              type: 'list',
              name: 'priority',
              message: 'Priority:',
              choices: ['low', 'medium', 'high', 'critical'],
              default: 'medium',
            },
          ]);

          feedbackData = answers;
        } else {
          feedbackData = {
            title: options.title,
            description: options.description ?? '',
            type: options.type ?? 'bug',
            priority: options.priority ?? 'medium',
          };
        }

        const spinner = ora('Creating feedback...').start();

        const created = await apiClient.createFeedback(feedbackData as Omit<Feedback, 'id' | 'createdAt' | 'updatedAt'>);

        spinner.succeed(chalk.green(`Created feedback ${chalk.bold(created.id)}`));
      } catch (error) {
        if (error instanceof Error) {
          logger.error(error.message);
        }
        process.exit(1);
      }
    });

  // feedback update
  feedback
    .command('update <id>')
    .description('Update a feedback item')
    .option('-s, --status <status>', 'Update status')
    .option('-p, --priority <priority>', 'Update priority')
    .option('--add-tag <tag>', 'Add a tag')
    .option('--remove-tag <tag>', 'Remove a tag')
    .option('-i, --interactive', 'Interactive mode')
    .action(async (id: string, options) => {
      const spinner = ora('Updating feedback...').start();

      try {
        const updates: Record<string, unknown> = {};

        if (options.status) updates.status = options.status;
        if (options.priority) updates.priority = options.priority;

        const updated = await apiClient.updateFeedback(id, updates);

        spinner.succeed(chalk.green(`Updated feedback ${chalk.bold(id)}`));
        displayFeedbackDetails(updated);
      } catch (error) {
        spinner.fail(chalk.red('Failed to update feedback'));
        if (error instanceof Error) {
          logger.error(error.message);
        }
        process.exit(1);
      }
    });

  // feedback delete
  feedback
    .command('delete <id>')
    .description('Delete a feedback item')
    .option('-f, --force', 'Skip confirmation prompt')
    .action(async (id: string, options) => {
      try {
        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to delete feedback ${id}?`,
              default: false,
            },
          ]);

          if (!confirm) {
            logger.info('Cancelled');
            return;
          }
        }

        const spinner = ora('Deleting feedback...').start();

        await apiClient.deleteFeedback(id);

        spinner.succeed(chalk.green(`Deleted feedback ${chalk.bold(id)}`));
      } catch (error) {
        if (error instanceof Error) {
          logger.error(error.message);
        }
        process.exit(1);
      }
    });
}

// Helper functions
function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 1) + '…';
}

function formatType(type: string): string {
  const colors: Record<string, (s: string) => string> = {
    bug: chalk.red,
    feature: chalk.green,
    improvement: chalk.blue,
    question: chalk.yellow,
  };
  return (colors[type] ?? chalk.white)(type);
}

function formatStatus(status: string): string {
  const colors: Record<string, (s: string) => string> = {
    new: chalk.cyan,
    acknowledged: chalk.yellow,
    in_progress: chalk.blue,
    resolved: chalk.green,
    closed: chalk.dim,
  };
  return (colors[status] ?? chalk.white)(status.replace('_', ' '));
}

function formatPriority(priority: string): string {
  const colors: Record<string, (s: string) => string> = {
    low: chalk.dim,
    medium: chalk.yellow,
    high: chalk.red,
    critical: chalk.bgRed.white,
  };
  return (colors[priority] ?? chalk.white)(priority);
}

function displayFeedbackDetails(item: Feedback): void {
  console.log();
  console.log(chalk.bold(`  ${item.title}`));
  console.log(chalk.dim('  ────────────────────────────────────────'));
  console.log(`  ${chalk.dim('ID:')}        ${item.id}`);
  console.log(`  ${chalk.dim('Type:')}      ${formatType(item.type)}`);
  console.log(`  ${chalk.dim('Status:')}    ${formatStatus(item.status)}`);
  console.log(`  ${chalk.dim('Priority:')}  ${formatPriority(item.priority)}`);
  console.log(`  ${chalk.dim('Created:')}   ${format(new Date(item.createdAt), 'PPpp')}`);
  console.log(`  ${chalk.dim('Updated:')}   ${format(new Date(item.updatedAt), 'PPpp')}`);
  if (item.description) {
    console.log();
    console.log(chalk.dim('  Description:'));
    console.log(`  ${item.description}`);
  }
  console.log();
}
