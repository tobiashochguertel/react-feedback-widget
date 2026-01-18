/**
 * Export Utilities
 *
 * Functions for exporting feedback data in various formats.
 */

import { stringify } from 'csv-stringify/sync';
import { format } from 'date-fns';

import type { Feedback } from '../types/index.js';

/**
 * Export feedback to JSON format
 */
export async function exportToJson(
  items: Feedback[],
  includeMedia?: boolean
): Promise<string> {
  const data = {
    exportedAt: new Date().toISOString(),
    count: items.length,
    items: items.map((item) => ({
      ...item,
      // Remove media data if not requested
      screenshots: includeMedia ? item.screenshots : undefined,
      videoId: includeMedia ? item.videoId : undefined,
    })),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Export feedback to CSV format
 */
export async function exportToCsv(items: Feedback[]): Promise<string> {
  const records = items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description ?? '',
    type: item.type,
    status: item.status,
    priority: item.priority,
    createdAt: format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    updatedAt: format(new Date(item.updatedAt), 'yyyy-MM-dd HH:mm:ss'),
    url: item.environment?.url ?? '',
    userAgent: item.environment?.userAgent ?? '',
    hasScreenshot: item.screenshots && item.screenshots.length > 0 ? 'Yes' : 'No',
    hasVideo: item.videoId ? 'Yes' : 'No',
  }));

  return stringify(records, {
    header: true,
    columns: {
      id: 'ID',
      title: 'Title',
      description: 'Description',
      type: 'Type',
      status: 'Status',
      priority: 'Priority',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      url: 'URL',
      userAgent: 'User Agent',
      hasScreenshot: 'Has Screenshot',
      hasVideo: 'Has Video',
    },
  });
}

/**
 * Export feedback to Markdown format
 */
export async function exportToMarkdown(items: Feedback[]): Promise<string> {
  const lines: string[] = [];

  // Header
  lines.push('# Feedback Export');
  lines.push('');
  lines.push(`> Exported on ${format(new Date(), 'MMMM d, yyyy HH:mm')}`);
  lines.push(`> Total items: ${items.length}`);
  lines.push('');

  // Summary table
  lines.push('## Summary');
  lines.push('');
  lines.push('| Status | Count |');
  lines.push('| ------ | ----- |');

  const statusCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  for (const [status, count] of Object.entries(statusCounts)) {
    lines.push(`| ${status} | ${count} |`);
  }

  lines.push('');

  // Individual feedback items
  lines.push('## Feedback Items');
  lines.push('');

  for (const item of items) {
    lines.push(`### ${item.title}`);
    lines.push('');
    lines.push(`- **ID:** \`${item.id}\``);
    lines.push(`- **Type:** ${item.type}`);
    lines.push(`- **Status:** ${item.status}`);
    lines.push(`- **Priority:** ${item.priority}`);
    lines.push(`- **Created:** ${format(new Date(item.createdAt), 'MMMM d, yyyy')}`);
    lines.push('');

    if (item.description) {
      lines.push('#### Description');
      lines.push('');
      lines.push(item.description);
      lines.push('');
    }

    if (item.environment?.url) {
      lines.push(`**URL:** ${item.environment.url}`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}
