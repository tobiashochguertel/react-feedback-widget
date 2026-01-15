/**
 * Jira Validation
 *
 * Validation logic for Jira integration configuration.
 *
 * @module integrations/jira/jiraValidation
 */

import type { ValidationResult, ValidationError } from '../types.js';
import type { JiraClientConfig, JiraHandlerConfig } from './jiraTypes.js';

/**
 * Validate Jira client configuration.
 *
 * @param config - Configuration to validate
 * @returns Validation result with errors if invalid
 */
export function validateJiraClientConfig(
  config: Partial<JiraClientConfig>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check required fields
  const domain = config.domain ?? process.env.JIRA_DOMAIN;
  const email = config.email ?? process.env.JIRA_EMAIL;
  const apiToken = config.apiToken ?? process.env.JIRA_API_TOKEN;

  if (!domain) {
    errors.push({
      field: 'domain',
      message: 'Jira domain is required',
      code: 'MISSING_DOMAIN',
    });
  } else {
    // Validate domain format
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (!cleanDomain.includes('.')) {
      errors.push({
        field: 'domain',
        message: 'Invalid Jira domain format. Expected format: company.atlassian.net',
        code: 'INVALID_DOMAIN_FORMAT',
      });
    }
  }

  if (!email) {
    errors.push({
      field: 'email',
      message: 'Jira email is required',
      code: 'MISSING_EMAIL',
    });
  } else {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT',
      });
    }
  }

  if (!apiToken) {
    errors.push({
      field: 'apiToken',
      message: 'Jira API token is required',
      code: 'MISSING_API_TOKEN',
    });
  } else if (apiToken.length < 10) {
    errors.push({
      field: 'apiToken',
      message: 'API token appears to be invalid (too short)',
      code: 'INVALID_API_TOKEN',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Jira handler configuration.
 *
 * @param config - Handler configuration to validate
 * @returns Validation result with errors if invalid
 */
export function validateJiraHandlerConfig(
  config: Partial<JiraHandlerConfig>
): ValidationResult {
  const errors: ValidationError[] = [];

  // First validate client config
  const clientValidation = validateJiraClientConfig(config);
  errors.push(...clientValidation.errors);

  // Validate project key if provided
  const projectKey = config.projectKey ?? process.env.JIRA_PROJECT_KEY;
  if (projectKey) {
    // Project keys are typically uppercase letters
    const projectKeyRegex = /^[A-Z][A-Z0-9_]*$/;
    if (!projectKeyRegex.test(projectKey)) {
      errors.push({
        field: 'projectKey',
        message: 'Project key should be uppercase letters and numbers (e.g., PROJ, BUG123)',
        code: 'INVALID_PROJECT_KEY',
      });
    }
  }

  // Validate status mapping if provided
  if (config.statusMapping) {
    if (config.statusMapping.toJira) {
      const toJira = config.statusMapping.toJira;
      for (const [key, value] of Object.entries(toJira)) {
        if (typeof value !== 'string' || value.trim() === '') {
          errors.push({
            field: `statusMapping.toJira.${key}`,
            message: `Invalid status mapping value for "${key}"`,
            code: 'INVALID_STATUS_MAPPING',
          });
        }
      }
    }

    if (config.statusMapping.fromJira) {
      const fromJira = config.statusMapping.fromJira;
      for (const [key, value] of Object.entries(fromJira)) {
        if (typeof value !== 'string' || value.trim() === '') {
          errors.push({
            field: `statusMapping.fromJira.${key}`,
            message: `Invalid status mapping value for "${key}"`,
            code: 'INVALID_STATUS_MAPPING',
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that required fields are present for issue creation.
 *
 * @param feedbackData - Feedback data to validate
 * @returns Validation result with errors if invalid
 */
export function validateFeedbackForSubmission(
  feedbackData: { id?: string; feedback?: string }
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!feedbackData.id && !feedbackData.feedback) {
    errors.push({
      field: 'feedback',
      message: 'Feedback content is required',
      code: 'MISSING_FEEDBACK',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if configuration has minimum required values.
 *
 * @param config - Configuration to check
 * @returns true if minimally configured
 */
export function isJiraConfigured(config: Partial<JiraClientConfig>): boolean {
  const domain = config.domain ?? process.env.JIRA_DOMAIN;
  const email = config.email ?? process.env.JIRA_EMAIL;
  const apiToken = config.apiToken ?? process.env.JIRA_API_TOKEN;

  return Boolean(domain && email && apiToken);
}
