/**
 * Interactive Mode Command
 *
 * Provides a terminal-based interactive UI for browsing and managing feedback.
 * Uses arrow key navigation, filtering, and quick actions.
 *
 * TASK-CLI-020: Implement Interactive Mode
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { format } from 'date-fns';
import type { Feedback, FeedbackStatus } from '../types/index.js';
import { apiClient } from '../lib/api.js';
import { configManager } from '../lib/config.js';
import { logger } from '../utils/logger.js';

// Interactive mode state
interface InteractiveState {
  feedback: Feedback[];
  filteredFeedback: Feedback[];
  selectedIndex: number;
  filter: {
    status?: FeedbackStatus | undefined;
    type?: string | undefined;
    search?: string | undefined;
  };
  running: boolean;
}

// Status colors for display
const statusColors: Record<FeedbackStatus, (text: string) => string> = {
  pending: chalk.blue,
  in_progress: chalk.yellow,
  resolved: chalk.green,
  closed: chalk.gray,
  archived: chalk.gray,
};

// Type icons for display
const typeIcons: Record<string, string> = {
  bug: '🐛',
  feature: '✨',
  improvement: '🔧',
  question: '❓',
  other: '📝',
};

/**
 * Format a date for display
 */
function formatDateDisplay(date: string | Date | undefined): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'MMM d, yyyy HH:mm');
  } catch {
    return 'Invalid date';
  }
}

/**
 * Create the interactive command
 */
export function createInteractiveCommand(): Command {
  const cmd = new Command('interactive')
    .alias('i')
    .description('Open interactive mode for browsing feedback')
    .option('--status <status>', 'Initial status filter')
    .option('--type <type>', 'Initial type filter')
    .action(async (options) => {
      await runInteractiveMode(options);
    });

  return cmd;
}

/**
 * Run the interactive mode
 */
async function runInteractiveMode(options: {
  status?: string;
  type?: string;
}): Promise<void> {
  const serverUrl = configManager.get('serverUrl');

  if (!serverUrl) {
    console.error(chalk.red('Error: Server URL not configured.'));
    console.log(chalk.dim('Run: feedback-cli config set serverUrl <url>'));
    process.exit(1);
  }

  await apiClient.initialize();
  const spinner = ora('Loading feedback...').start();

  try {
    // Fetch all feedback
    const response = await apiClient.listFeedback({ limit: 100 });
    const items = response.data ?? [];
    spinner.succeed(`Loaded ${items.length} feedback items`);

    const state: InteractiveState = {
      feedback: items,
      filteredFeedback: items,
      selectedIndex: 0,
      filter: {
        status: options.status as FeedbackStatus | undefined,
        type: options.type,
      },
      running: true,
    };

    // Apply initial filters
    applyFilters(state);

    // Run main loop
    await mainLoop(state);
  } catch (error) {
    spinner.fail('Failed to load feedback');
    logger.error(`Interactive mode error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Apply current filters to feedback list
 */
function applyFilters(state: InteractiveState): void {
  let filtered = [...state.feedback];

  if (state.filter.status) {
    filtered = filtered.filter((f) => f.status === state.filter.status);
  }

  if (state.filter.type) {
    filtered = filtered.filter((f) => f.type === state.filter.type);
  }

  if (state.filter.search) {
    const search = state.filter.search.toLowerCase();
    filtered = filtered.filter(
      (f) =>
        f.title?.toLowerCase().includes(search) ||
        f.description?.toLowerCase().includes(search)
    );
  }

  state.filteredFeedback = filtered;
  state.selectedIndex = Math.min(
    state.selectedIndex,
    Math.max(0, filtered.length - 1)
  );
}

/**
 * Display the feedback list with current selection
 */
function displayList(state: InteractiveState): void {
  console.clear();

  // Header
  console.log(
    chalk.bold.cyan('╔══════════════════════════════════════════════════════════════════════╗')
  );
  console.log(
    chalk.bold.cyan('║') +
      chalk.bold.white('                    FEEDBACK INTERACTIVE MODE                         ') +
      chalk.bold.cyan('║')
  );
  console.log(
    chalk.bold.cyan('╚══════════════════════════════════════════════════════════════════════╝')
  );
  console.log();

  // Filter status
  const filterParts: string[] = [];
  if (state.filter.status) filterParts.push(`Status: ${state.filter.status}`);
  if (state.filter.type) filterParts.push(`Type: ${state.filter.type}`);
  if (state.filter.search) filterParts.push(`Search: "${state.filter.search}"`);

  if (filterParts.length > 0) {
    console.log(chalk.dim('Filters: ') + chalk.yellow(filterParts.join(' | ')));
  } else {
    console.log(chalk.dim('Filters: None (showing all)'));
  }

  console.log(
    chalk.dim(
      `Showing ${state.filteredFeedback.length} of ${state.feedback.length} items`
    )
  );
  console.log();

  // Feedback list
  if (state.filteredFeedback.length === 0) {
    console.log(chalk.gray('  No feedback items match the current filters.'));
  } else {
    // Show up to 10 items centered around selection
    const pageSize = 10;
    const start = Math.max(
      0,
      Math.min(
        state.selectedIndex - Math.floor(pageSize / 2),
        state.filteredFeedback.length - pageSize
      )
    );
    const end = Math.min(start + pageSize, state.filteredFeedback.length);

    for (let i = start; i < end; i++) {
      const item = state.filteredFeedback[i];
      if (!item) continue;

      const isSelected = i === state.selectedIndex;
      const prefix = isSelected ? chalk.cyan('❯ ') : '  ';
      const bg = isSelected ? chalk.bgBlue : (s: string) => s;

      const typeIcon = typeIcons[item.type ?? 'other'] ?? '📝';
      const statusKey = (item.status ?? 'pending') as FeedbackStatus;
      const statusColor = statusColors[statusKey] ?? chalk.white;
      const status = statusColor(`[${statusKey}]`);
      const title = item.title ?? 'Untitled';
      const date = formatDateDisplay(item.createdAt);

      const line = `${prefix}${typeIcon} ${status} ${title.slice(0, 40).padEnd(40)} ${chalk.dim(date)}`;
      console.log(isSelected ? bg(line) : line);
    }

    if (state.filteredFeedback.length > pageSize) {
      console.log(
        chalk.dim(
          `\n  Page ${Math.floor(state.selectedIndex / pageSize) + 1} of ${Math.ceil(state.filteredFeedback.length / pageSize)}`
        )
      );
    }
  }

  console.log();
  console.log(chalk.dim('─'.repeat(72)));
  console.log();

  // Help footer
  console.log(chalk.dim('Navigation:'));
  console.log(
    chalk.dim('  [↑/↓] Move  [Enter] View Details  [f] Filter  [s] Search  [q] Quit')
  );
  console.log(
    chalk.dim('  [n] New Status  [p] Set Priority  [d] Delete  [r] Refresh')
  );
}

/**
 * Show detailed view of a feedback item
 */
async function showDetails(item: Feedback): Promise<void> {
  console.clear();

  console.log(chalk.bold.cyan('═'.repeat(72)));
  console.log();
  console.log(chalk.bold.white(`  ${typeIcons[item.type ?? 'other'] ?? '📝'} ${item.title ?? 'Untitled'}`));
  console.log();
  console.log(chalk.dim('─'.repeat(72)));
  console.log();

  // Metadata
  console.log(`  ${chalk.bold('ID:')}       ${chalk.dim(item.id)}`);
  const statusKey = (item.status ?? 'pending') as FeedbackStatus;
  console.log(
    `  ${chalk.bold('Status:')}   ${statusColors[statusKey]?.(statusKey) ?? statusKey}`
  );
  console.log(`  ${chalk.bold('Type:')}     ${item.type ?? 'unknown'}`);
  console.log(`  ${chalk.bold('Priority:')} ${item.priority ?? 'unset'}`);
  console.log(`  ${chalk.bold('Created:')}  ${formatDateDisplay(item.createdAt)}`);
  if (item.updatedAt) {
    console.log(`  ${chalk.bold('Updated:')}  ${formatDateDisplay(item.updatedAt)}`);
  }

  console.log();
  console.log(chalk.dim('─'.repeat(72)));
  console.log();

  // Description
  console.log(chalk.bold('  Description:'));
  console.log();
  if (item.description) {
    const lines = item.description.split('\n');
    for (const line of lines) {
      console.log(`    ${line}`);
    }
  } else {
    console.log(chalk.dim('    No description provided.'));
  }

  console.log();

  // Environment info
  if (item.environment) {
    console.log(chalk.bold('  Environment:'));
    console.log(`    Browser:    ${item.environment.browser ?? 'N/A'}`);
    console.log(`    OS:         ${item.environment.os ?? 'N/A'}`);
    const screen = item.environment.viewportWidth && item.environment.viewportHeight
      ? `${item.environment.viewportWidth}x${item.environment.viewportHeight}`
      : 'N/A';
    console.log(`    Screen:     ${screen}`);
    console.log(`    User Agent: ${chalk.dim((item.environment.userAgent ?? 'N/A').slice(0, 50))}...`);
    console.log();
  }

  // Attachments
  const hasScreenshots = item.screenshots && item.screenshots.length > 0;
  const hasVideo = item.videoId !== undefined;
  if (hasScreenshots || hasVideo) {
    console.log(chalk.bold('  Attachments:'));
    if (hasScreenshots) console.log(`    📷 ${item.screenshots?.length} Screenshot(s) attached`);
    if (hasVideo) console.log('    🎥 Video attached');
    console.log();
  }

  console.log(chalk.dim('═'.repeat(72)));
  console.log();
  console.log(chalk.dim('  Press any key to return to list...'));

  // Wait for keypress
  await waitForKey();
}

/**
 * Wait for a single keypress
 */
async function waitForKey(): Promise<string> {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.once('data', (data) => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
      resolve(data.toString());
    });
  });
}

/**
 * Prompt for filter options
 */
async function promptFilter(state: InteractiveState): Promise<void> {
  const { filterType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'filterType',
      message: 'Filter by:',
      choices: [
        { name: 'Status', value: 'status' },
        { name: 'Type', value: 'type' },
        { name: 'Clear all filters', value: 'clear' },
        { name: 'Cancel', value: 'cancel' },
      ],
    },
  ]);

  if (filterType === 'cancel') return;

  if (filterType === 'clear') {
    state.filter = {};
    applyFilters(state);
    return;
  }

  if (filterType === 'status') {
    const { status } = await inquirer.prompt([
      {
        type: 'list',
        name: 'status',
        message: 'Select status:',
        choices: [
          { name: '🆕 Pending', value: 'pending' },
          { name: '🔄 In Progress', value: 'in_progress' },
          { name: '✅ Resolved', value: 'resolved' },
          { name: '🔒 Closed', value: 'closed' },
          { name: '📦 Archived', value: 'archived' },
          { name: 'Any', value: undefined },
        ],
      },
    ]);
    state.filter.status = status;
  }

  if (filterType === 'type') {
    const { type } = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Select type:',
        choices: [
          { name: '🐛 Bug', value: 'bug' },
          { name: '✨ Feature', value: 'feature' },
          { name: '🔧 Improvement', value: 'improvement' },
          { name: '❓ Question', value: 'question' },
          { name: '📝 Other', value: 'other' },
          { name: 'Any', value: undefined },
        ],
      },
    ]);
    state.filter.type = type;
  }

  applyFilters(state);
}

/**
 * Prompt for search
 */
async function promptSearch(state: InteractiveState): Promise<void> {
  const { search } = await inquirer.prompt([
    {
      type: 'input',
      name: 'search',
      message: 'Search (leave empty to clear):',
      default: state.filter.search ?? '',
    },
  ]);

  state.filter.search = search || undefined;
  applyFilters(state);
}

/**
 * Update feedback status
 */
async function updateStatus(item: Feedback): Promise<Feedback | null> {
  const { status } = await inquirer.prompt([
    {
      type: 'list',
      name: 'status',
      message: `Update status for "${(item.title ?? 'Untitled').slice(0, 30)}...":`,
      choices: [
        { name: '🆕 Pending', value: 'pending' },
        { name: '🔄 In Progress', value: 'in_progress' },
        { name: '✅ Resolved', value: 'resolved' },
        { name: '🔒 Closed', value: 'closed' },
        { name: '📦 Archived', value: 'archived' },
        { name: 'Cancel', value: null },
      ],
      default: item.status,
    },
  ]);

  if (!status) return null;

  const spinner = ora('Updating status...').start();
  try {
    const updated = await apiClient.updateFeedback(item.id, { status });
    spinner.succeed('Status updated');
    return updated;
  } catch (error) {
    spinner.fail('Failed to update status');
    logger.error(`Update error: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Update feedback priority
 */
async function updatePriority(item: Feedback): Promise<Feedback | null> {
  const { priority } = await inquirer.prompt([
    {
      type: 'list',
      name: 'priority',
      message: `Set priority for "${(item.title ?? 'Untitled').slice(0, 30)}...":`,
      choices: [
        { name: '🔴 High', value: 'high' },
        { name: '🟡 Medium', value: 'medium' },
        { name: '🟢 Low', value: 'low' },
        { name: 'Cancel', value: null },
      ],
      default: item.priority,
    },
  ]);

  if (!priority) return null;

  const spinner = ora('Updating priority...').start();
  try {
    const updated = await apiClient.updateFeedback(item.id, { priority });
    spinner.succeed('Priority updated');
    return updated;
  } catch (error) {
    spinner.fail('Failed to update priority');
    logger.error(`Update error: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Delete feedback item
 */
async function deleteFeedback(item: Feedback): Promise<boolean> {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.red(`Delete "${(item.title ?? 'Untitled').slice(0, 30)}..."? This cannot be undone.`),
      default: false,
    },
  ]);

  if (!confirm) return false;

  const spinner = ora('Deleting...').start();
  try {
    await apiClient.deleteFeedback(item.id);
    spinner.succeed('Feedback deleted');
    return true;
  } catch (error) {
    spinner.fail('Failed to delete');
    logger.error(`Delete error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Refresh feedback list
 */
async function refreshFeedback(state: InteractiveState): Promise<void> {
  const spinner = ora('Refreshing...').start();
  try {
    const response = await apiClient.listFeedback({ limit: 100 });
    state.feedback = response.data ?? [];
    applyFilters(state);
    spinner.succeed(`Loaded ${state.feedback.length} items`);
  } catch (error) {
    spinner.fail('Failed to refresh');
    logger.error(`Refresh error: ${error instanceof Error ? error.message : String(error)}`);
  }
  await new Promise((r) => setTimeout(r, 500));
}

/**
 * Main interactive loop
 */
async function mainLoop(state: InteractiveState): Promise<void> {
  while (state.running) {
    displayList(state);

    const key = await waitForKey();
    const keyStr = key.toString();

    // Handle escape sequences for arrow keys
    if (keyStr.startsWith('\x1b[')) {
      const arrowKey = keyStr.slice(2);
      if (arrowKey === 'A') {
        // Up arrow
        state.selectedIndex = Math.max(0, state.selectedIndex - 1);
      } else if (arrowKey === 'B') {
        // Down arrow
        state.selectedIndex = Math.min(
          state.filteredFeedback.length - 1,
          state.selectedIndex + 1
        );
      }
      continue;
    }

    // Handle regular keys
    switch (keyStr.toLowerCase()) {
      case 'q':
      case '\x03': // Ctrl+C
        state.running = false;
        console.clear();
        console.log(chalk.cyan('👋 Goodbye!'));
        break;

      case '\r': // Enter
      case '\n': {
        const selectedItem = state.filteredFeedback[state.selectedIndex];
        if (selectedItem) {
          await showDetails(selectedItem);
        }
        break;
      }

      case 'f':
        await promptFilter(state);
        break;

      case 's':
        await promptSearch(state);
        break;

      case 'n': {
        const itemToUpdate = state.filteredFeedback[state.selectedIndex];
        if (itemToUpdate) {
          const updated = await updateStatus(itemToUpdate);
          if (updated) {
            const index = state.feedback.findIndex((f) => f.id === updated.id);
            if (index >= 0) state.feedback[index] = updated;
            applyFilters(state);
          }
        }
        break;
      }

      case 'p': {
        const itemToPrioritize = state.filteredFeedback[state.selectedIndex];
        if (itemToPrioritize) {
          const updated = await updatePriority(itemToPrioritize);
          if (updated) {
            const index = state.feedback.findIndex((f) => f.id === updated.id);
            if (index >= 0) state.feedback[index] = updated;
            applyFilters(state);
          }
        }
        break;
      }

      case 'd': {
        const itemToDelete = state.filteredFeedback[state.selectedIndex];
        if (itemToDelete) {
          const deleted = await deleteFeedback(itemToDelete);
          if (deleted) {
            state.feedback = state.feedback.filter((f) => f.id !== itemToDelete.id);
            applyFilters(state);
          }
        }
        break;
      }

      case 'r':
        await refreshFeedback(state);
        break;

      case 'k':
        // Vim up
        state.selectedIndex = Math.max(0, state.selectedIndex - 1);
        break;

      case 'j':
        // Vim down
        state.selectedIndex = Math.min(
          state.filteredFeedback.length - 1,
          state.selectedIndex + 1
        );
        break;

      default:
        // Ignore unknown keys
        break;
    }
  }
}

export default createInteractiveCommand;
