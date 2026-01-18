/**
 * Output Formatters
 *
 * Format data for different output types (table, json, yaml).
 */

import { stringify as yamlStringify } from 'yaml';

/**
 * Format data based on the requested output format
 */
export function formatOutput(data: unknown, format: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);

    case 'yaml':
      return yamlStringify(data, { indent: 2 });

    default:
      // For table format, the caller should handle table construction
      return JSON.stringify(data, null, 2);
  }
}
