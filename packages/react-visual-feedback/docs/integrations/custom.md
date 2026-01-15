# Building Custom Integrations

> **Updated:** 2026-01-16
> **Related:** [Integration Guide](./README.md), [Jira Integration](./jira.md), [Sheets Integration](./sheets.md)

## Overview

Create custom integrations to send feedback to any backend service. Implement the `Integration` interface to plug into the react-visual-feedback ecosystem.

## Integration Interface

Every integration must implement this interface:

```typescript
interface Integration<TConfig = unknown, TResult = unknown> {
  /** Integration type identifier */
  readonly type: IntegrationType;

  /** Human-readable name */
  readonly name: string;

  /** Description of the integration */
  readonly description: string;

  /** Icon component or URL */
  readonly icon?: ComponentType<{ size?: number }> | string;

  /**
   * Check if the integration is properly configured.
   */
  isConfigured(): boolean;

  /**
   * Validate a configuration object.
   */
  validateConfig(config: TConfig): ValidationResult;

  /**
   * Submit feedback data to the integration.
   */
  submit(data: FeedbackData, options?: SubmissionOptions): Promise<SubmissionResult<TResult>>;

  /**
   * Get the React component for the configuration modal.
   */
  getConfigModal(): ComponentType<ConfigModalProps<TConfig>>;

  /**
   * Get current configuration.
   */
  getConfig(): TConfig | undefined;

  /**
   * Update configuration.
   */
  setConfig(config: TConfig): void;
}
```

## Quick Start

### Step 1: Define Your Config Type

```typescript
// types/slackTypes.ts
export interface SlackIntegrationConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}
```

### Step 2: Create the Integration Class

```typescript
// integrations/slack/SlackIntegration.ts
import type {
  Integration,
  IntegrationType,
  ValidationResult,
  SubmissionResult,
  FeedbackData,
  ConfigModalProps,
} from 'react-visual-feedback';
import type { SlackIntegrationConfig } from './slackTypes';
import { SlackConfigModal } from './SlackConfigModal';

export class SlackIntegration implements Integration<SlackIntegrationConfig, { ts: string }> {
  readonly type: IntegrationType = 'custom';
  readonly name = 'Slack';
  readonly description = 'Send feedback notifications to Slack';
  readonly icon = '💬'; // or React component

  private config: SlackIntegrationConfig | undefined;

  constructor(config?: SlackIntegrationConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return Boolean(this.config?.webhookUrl);
  }

  validateConfig(config: SlackIntegrationConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.webhookUrl) {
      errors.push('Webhook URL is required');
    } else if (!config.webhookUrl.startsWith('https://hooks.slack.com/')) {
      errors.push('Invalid Slack webhook URL');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async submit(data: FeedbackData): Promise<SubmissionResult<{ ts: string }>> {
    if (!this.config) {
      return {
        success: false,
        errorCode: 'NOT_CONFIGURED',
        error: 'Slack integration not configured',
      };
    }

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.formatMessage(data)),
      });

      if (!response.ok) {
        return {
          success: false,
          errorCode: 'SUBMISSION_FAILED',
          error: `Slack API error: ${response.status}`,
        };
      }

      return {
        success: true,
        data: { ts: new Date().toISOString() },
      };
    } catch (error) {
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private formatMessage(data: FeedbackData) {
    return {
      channel: this.config?.channel,
      username: this.config?.username || 'Feedback Bot',
      icon_emoji: this.config?.iconEmoji || ':speech_balloon:',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${this.getTypeEmoji(data.type)} ${data.title}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: data.description || '_No description provided_',
          },
        },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: `*Type:* ${data.type}` },
            { type: 'mrkdwn', text: `*URL:* ${data.url}` },
            { type: 'mrkdwn', text: `*Time:* ${new Date().toISOString()}` },
          ],
        },
      ],
    };
  }

  private getTypeEmoji(type: string): string {
    const emojis: Record<string, string> = {
      bug: '🐛',
      feature: '✨',
      improvement: '📈',
      question: '❓',
    };
    return emojis[type] || '📝';
  }

  getConfigModal() {
    return SlackConfigModal;
  }

  getConfig() {
    return this.config;
  }

  setConfig(config: SlackIntegrationConfig) {
    this.config = config;
  }
}
```

### Step 3: Create the Config Modal

```tsx
// integrations/slack/SlackConfigModal.tsx
import React, { useState } from 'react';
import type { ConfigModalProps } from 'react-visual-feedback';
import type { SlackIntegrationConfig } from './slackTypes';

export function SlackConfigModal({
  config,
  onSave,
  onCancel,
  onTest,
}: ConfigModalProps<SlackIntegrationConfig>) {
  const [webhookUrl, setWebhookUrl] = useState(config?.webhookUrl || '');
  const [channel, setChannel] = useState(config?.channel || '');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const newConfig: SlackIntegrationConfig = {
      webhookUrl,
      channel: channel || undefined,
    };
    onSave(newConfig);
  };

  const handleTest = async () => {
    if (!onTest) return;

    setTesting(true);
    setError(null);

    try {
      const result = await onTest({ webhookUrl, channel });
      if (!result.success) {
        setError(result.error || 'Test failed');
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="slack-config-modal">
      <h2>Configure Slack Integration</h2>

      <div className="form-group">
        <label htmlFor="webhookUrl">Webhook URL *</label>
        <input
          id="webhookUrl"
          type="url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://hooks.slack.com/services/..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="channel">Channel (optional)</label>
        <input
          id="channel"
          type="text"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          placeholder="#feedback"
        />
      </div>

      {error && <div className="error">{error}</div>}

      <div className="actions">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={handleTest} disabled={testing || !webhookUrl}>
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <button onClick={handleSave} disabled={!webhookUrl}>
          Save
        </button>
      </div>
    </div>
  );
}
```

### Step 4: Register the Integration

```tsx
// integrations/slack/index.ts
import { IntegrationFactory } from 'react-visual-feedback';
import { SlackIntegration } from './SlackIntegration';

export function registerSlackIntegration(factory: IntegrationFactory) {
  factory.register(SlackIntegration, {
    type: 'custom',
    name: 'Slack',
    description: 'Send feedback notifications to Slack',
    icon: '💬',
    connectionTypes: ['webhook'],
    requiresServer: false,
    docsUrl: 'https://api.slack.com/messaging/webhooks',
  });
}
```

### Step 5: Use in Your App

```tsx
// App.tsx
import { FeedbackProvider } from 'react-visual-feedback';
import { SlackIntegration } from './integrations/slack';

function App() {
  return (
    <FeedbackProvider
      customIntegrations={[
        new SlackIntegration({
          webhookUrl: process.env.REACT_APP_SLACK_WEBHOOK!,
          channel: '#feedback',
        }),
      ]}
    >
      <YourApp />
    </FeedbackProvider>
  );
}
```

## Using IntegrationFactory

The factory pattern enables dynamic integration management:

```typescript
import { IntegrationFactory } from 'react-visual-feedback';
import { JiraIntegration, jiraMetadata } from './jira';
import { SlackIntegration, slackMetadata } from './slack';

// Create factory
const factory = new IntegrationFactory();

// Register integrations
factory.register(JiraIntegration, jiraMetadata);
factory.register(SlackIntegration, slackMetadata);

// Create instance by type
const jira = factory.create('jira', { endpoint: '/api/jira' });

// Check available types
const types = factory.getAvailable(); // ['jira', 'custom']

// Get metadata
const metadata = factory.getMetadata('jira');
// { type: 'jira', name: 'Jira', description: '...' }

// Check if registered
if (factory.has('slack')) {
  const slack = factory.create('custom', { webhookUrl: '...' });
}

// Unregister
factory.unregister('custom');

// Get all metadata
const allMetadata = factory.getAllMetadata();
```

## Core Types

### ValidationResult

```typescript
interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}
```

### SubmissionResult

```typescript
interface SubmissionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}
```

### FeedbackData

```typescript
interface FeedbackData {
  type: 'bug' | 'feature' | 'improvement' | 'question';
  title: string;
  description?: string;
  screenshot?: string; // base64 or URL
  recording?: string; // recording URL
  url: string;
  userAgent: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
```

### ConfigModalProps

```typescript
interface ConfigModalProps<TConfig> {
  config?: TConfig;
  onSave: (config: TConfig) => void;
  onCancel: () => void;
  onTest?: (config: TConfig) => Promise<{ success: boolean; error?: string }>;
}
```

### IntegrationMetadata

```typescript
interface IntegrationMetadata {
  type: IntegrationType;
  name: string;
  description: string;
  icon?: ComponentType<{ size?: number }> | string;
  connectionTypes: IntegrationConnectionType[];
  requiresServer: boolean;
  docsUrl?: string;
}

type IntegrationConnectionType =
  | 'oauth'
  | 'api_key'
  | 'webhook'
  | 'server_proxy';
```

## Examples

### Discord Integration

```typescript
export class DiscordIntegration implements Integration<DiscordConfig, void> {
  readonly type: IntegrationType = 'custom';
  readonly name = 'Discord';
  readonly description = 'Send feedback to Discord channel';

  private config: DiscordConfig | undefined;

  constructor(config?: DiscordConfig) {
    this.config = config;
  }

  isConfigured() {
    return Boolean(this.config?.webhookUrl);
  }

  validateConfig(config: DiscordConfig): ValidationResult {
    if (!config.webhookUrl?.includes('discord.com/api/webhooks')) {
      return { valid: false, errors: ['Invalid Discord webhook URL'] };
    }
    return { valid: true };
  }

  async submit(data: FeedbackData): Promise<SubmissionResult<void>> {
    const response = await fetch(this.config!.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `${data.type}: ${data.title}`,
          description: data.description,
          color: this.getColor(data.type),
          fields: [
            { name: 'URL', value: data.url, inline: true },
            { name: 'Time', value: data.timestamp, inline: true },
          ],
          image: data.screenshot ? { url: data.screenshot } : undefined,
        }],
      }),
    });

    return { success: response.ok };
  }

  private getColor(type: string): number {
    const colors: Record<string, number> = {
      bug: 0xE74C3C,      // Red
      feature: 0x3498DB,   // Blue
      improvement: 0x2ECC71, // Green
      question: 0xF39C12,  // Orange
    };
    return colors[type] || 0x95A5A6;
  }

  getConfigModal() { return DiscordConfigModal; }
  getConfig() { return this.config; }
  setConfig(config: DiscordConfig) { this.config = config; }
}
```

### Email Integration (via API)

```typescript
export class EmailIntegration implements Integration<EmailConfig, { messageId: string }> {
  readonly type: IntegrationType = 'custom';
  readonly name = 'Email';
  readonly description = 'Send feedback via email';

  private config: EmailConfig | undefined;

  isConfigured() {
    return Boolean(this.config?.apiEndpoint && this.config?.recipients?.length);
  }

  validateConfig(config: EmailConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.apiEndpoint) {
      errors.push('API endpoint is required');
    }
    if (!config.recipients?.length) {
      errors.push('At least one recipient is required');
    }
    config.recipients?.forEach((email, i) => {
      if (!email.includes('@')) {
        errors.push(`Invalid email at position ${i + 1}`);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  async submit(data: FeedbackData): Promise<SubmissionResult<{ messageId: string }>> {
    const response = await fetch(this.config!.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config!.apiKey}`,
      },
      body: JSON.stringify({
        to: this.config!.recipients,
        subject: `[Feedback] ${data.type}: ${data.title}`,
        html: this.formatHtml(data),
        attachments: data.screenshot ? [{
          filename: 'screenshot.png',
          content: data.screenshot.split(',')[1],
          encoding: 'base64',
        }] : [],
      }),
    });

    const result = await response.json();
    return {
      success: response.ok,
      data: { messageId: result.messageId },
    };
  }

  private formatHtml(data: FeedbackData): string {
    return `
      <h2>${data.title}</h2>
      <p><strong>Type:</strong> ${data.type}</p>
      <p><strong>URL:</strong> ${data.url}</p>
      <p><strong>Description:</strong></p>
      <p>${data.description || 'No description'}</p>
    `;
  }

  getConfigModal() { return EmailConfigModal; }
  getConfig() { return this.config; }
  setConfig(config: EmailConfig) { this.config = config; }
}
```

### Local Storage Integration (for testing)

```typescript
export class LocalStorageIntegration implements Integration<LocalStorageConfig, { id: string }> {
  readonly type: IntegrationType = 'custom';
  readonly name = 'Local Storage';
  readonly description = 'Store feedback in browser localStorage';

  private config: LocalStorageConfig | undefined;
  private readonly STORAGE_KEY = 'feedback_submissions';

  isConfigured() {
    return true; // Always available
  }

  validateConfig(): ValidationResult {
    return { valid: true };
  }

  async submit(data: FeedbackData): Promise<SubmissionResult<{ id: string }>> {
    const id = crypto.randomUUID();
    const submissions = this.getSubmissions();

    submissions.push({ id, ...data, submittedAt: new Date().toISOString() });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(submissions));

    return { success: true, data: { id } };
  }

  getSubmissions(): Array<FeedbackData & { id: string }> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  clearSubmissions(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getConfigModal() { return LocalStorageConfigModal; }
  getConfig() { return this.config; }
  setConfig(config: LocalStorageConfig) { this.config = config; }
}
```

## Best Practices

### 1. Validate Configuration Thoroughly

```typescript
validateConfig(config: MyConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!config.endpoint) {
    errors.push('Endpoint is required');
  }

  // Format validation
  if (config.endpoint && !config.endpoint.startsWith('https://')) {
    warnings.push('Consider using HTTPS for security');
  }

  // Length limits
  if (config.name && config.name.length > 100) {
    errors.push('Name must be 100 characters or less');
  }

  return { valid: errors.length === 0, errors, warnings };
}
```

### 2. Handle Errors Gracefully

```typescript
async submit(data: FeedbackData): Promise<SubmissionResult<T>> {
  try {
    const response = await fetch(/* ... */);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        errorCode: `HTTP_${response.status}`,
        error: errorData.message || `HTTP error: ${response.status}`,
      };
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        error: 'Network connection failed',
      };
    }
    return {
      success: false,
      errorCode: 'UNKNOWN_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### 3. Support Retries

```typescript
async submit(data: FeedbackData, options?: SubmissionOptions): Promise<SubmissionResult<T>> {
  const maxRetries = options?.maxRetries ?? 3;
  const retryDelay = options?.retryDelay ?? 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await this.attemptSubmit(data);

    if (result.success || !this.isRetryable(result.errorCode)) {
      return result;
    }

    if (attempt < maxRetries - 1) {
      await this.delay(retryDelay * Math.pow(2, attempt));
    }
  }

  return {
    success: false,
    errorCode: 'MAX_RETRIES_EXCEEDED',
    error: `Failed after ${maxRetries} attempts`,
  };
}

private isRetryable(errorCode?: string): boolean {
  return ['NETWORK_ERROR', 'HTTP_429', 'HTTP_503', 'HTTP_504'].includes(errorCode || '');
}
```

### 4. Include Timeout

```typescript
async submit(data: FeedbackData): Promise<SubmissionResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(this.config!.endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    return { success: response.ok, data: await response.json() };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        success: false,
        errorCode: 'TIMEOUT',
        error: 'Request timed out after 30 seconds',
      };
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

## Testing Custom Integrations

```typescript
import { describe, test, expect, vi } from 'vitest';
import { SlackIntegration } from './SlackIntegration';

describe('SlackIntegration', () => {
  test('isConfigured returns false without config', () => {
    const integration = new SlackIntegration();
    expect(integration.isConfigured()).toBe(false);
  });

  test('isConfigured returns true with webhook URL', () => {
    const integration = new SlackIntegration({
      webhookUrl: 'https://hooks.slack.com/services/xxx',
    });
    expect(integration.isConfigured()).toBe(true);
  });

  test('validateConfig rejects invalid webhook URL', () => {
    const integration = new SlackIntegration();
    const result = integration.validateConfig({
      webhookUrl: 'https://example.com/webhook',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid Slack webhook URL');
  });

  test('submit sends formatted message', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    const integration = new SlackIntegration({
      webhookUrl: 'https://hooks.slack.com/services/xxx',
    });

    const result = await integration.submit({
      type: 'bug',
      title: 'Test Bug',
      description: 'Test description',
      url: 'https://example.com',
      timestamp: '2024-01-01T00:00:00Z',
      userAgent: 'Test Agent',
    });

    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/services/xxx',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Test Bug'),
      })
    );
  });
});
```

---

*Documentation compiled by GitHub Copilot*
*For project: react-visual-feedback*
