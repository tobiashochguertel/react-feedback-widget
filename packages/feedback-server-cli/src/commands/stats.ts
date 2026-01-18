/**
 * Stats Command
 *
 * Command to show summary statistics for feedback.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import boxen from 'boxen';

import { apiClient } from '../lib/api.js';
import { formatOutput } from '../lib/output.js';
import { logger } from '../utils/logger.js';

/**
 * Register stats command with the CLI
 */
export function registerStatsCommand(program: Command): void {
  program
    .command('stats')
    .description('Show feedback statistics')
    .option('-o, --output <format>', 'Output format (json|table)', 'table')
    .action(async (options) => {
      const spinner = ora('Fetching statistics...').start();

      try {
        const stats = await apiClient.getStats();

        spinner.stop();

        const outputFormat = options.output ?? program.opts().output ?? 'table';

        if (outputFormat === 'json') {
          console.log(formatOutput(stats, 'json'));
          return;
        }

        // Display stats in a nice format
        console.log();
        console.log(
          boxen(
            chalk.bold.white(`Total Feedback: ${chalk.cyan(stats.total)}`),
            {
              padding: 1,
              margin: { left: 2, right: 0, top: 0, bottom: 0 },
              borderColor: 'cyan',
              borderStyle: 'round',
            }
          )
        );

        // Status breakdown
        console.log(chalk.bold('\n  By Status\n'));
        const statusTable = new Table({
          head: [chalk.bold('Status'), chalk.bold('Count'), chalk.bold('Percentage')],
          colWidths: [15, 10, 15],
        });

        for (const [status, count] of Object.entries(stats.byStatus)) {
          const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : '0.0';
          statusTable.push([
            formatStatus(status),
            count.toString(),
            `${percentage}%`,
          ]);
        }

        console.log(statusTable.toString());

        // Type breakdown
        console.log(chalk.bold('\n  By Type\n'));
        const typeTable = new Table({
          head: [chalk.bold('Type'), chalk.bold('Count'), chalk.bold('Percentage')],
          colWidths: [15, 10, 15],
        });

        for (const [type, count] of Object.entries(stats.byType)) {
          const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : '0.0';
          typeTable.push([
            formatType(type),
            count.toString(),
            `${percentage}%`,
          ]);
        }

        console.log(typeTable.toString());

        // Priority breakdown
        console.log(chalk.bold('\n  By Priority\n'));
        const priorityTable = new Table({
          head: [chalk.bold('Priority'), chalk.bold('Count'), chalk.bold('Percentage')],
          colWidths: [15, 10, 15],
        });

        for (const [priority, count] of Object.entries(stats.byPriority)) {
          const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : '0.0';
          priorityTable.push([
            formatPriority(priority),
            count.toString(),
            `${percentage}%`,
          ]);
        }

        console.log(priorityTable.toString());
        console.log();
      } catch (error) {
        spinner.fail(chalk.red('Failed to fetch statistics'));
        if (error instanceof Error) {
          logger.error(error.message);
        }
        process.exit(1);
      }
    });
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

function formatType(type: string): string {
  const colors: Record<string, (s: string) => string> = {
    bug: chalk.red,
    feature: chalk.green,
    improvement: chalk.blue,
    question: chalk.yellow,
  };
  return (colors[type] ?? chalk.white)(type);
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
