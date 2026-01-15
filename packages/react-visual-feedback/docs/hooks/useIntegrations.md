# useIntegrations

> **Updated:** 2026-01-16  
> **Related:** [Hooks Overview](./README.md), [Integration Guide](../integrations/)

## Purpose

Manages external service integrations (Jira, Google Sheets, custom) with OAuth, configuration, and submission handling.

## Import

```typescript
import { useIntegrations } from 'react-visual-feedback';
import type { 
  UseIntegrationsOptions, 
  UseIntegrationsReturn,
  IntegrationType,
  IntegrationConfig,
  IntegrationResult,
  JiraConfig,
  SheetsConfig,
} from 'react-visual-feedback';
```

## API

### Types

```typescript
type IntegrationType = 'jira' | 'sheets' | 'custom';

interface IntegrationConfig {
  /** Type of integration */
  type: IntegrationType;
  /** Whether integration is enabled */
  enabled: boolean;
  /** Display name */
  name: string;
  /** Configuration options */
  config: JiraConfig | SheetsConfig | CustomConfig;
}

interface JiraConfig {
  /** Jira instance URL (e.g., https://company.atlassian.net) */
  baseUrl: string;
  /** API token or OAuth token */
  apiToken?: string;
  /** OAuth client ID */
  clientId?: string;
  /** Default project key */
  projectKey: string;
  /** Default issue type */
  issueType?: string;
  /** Custom field mappings */
  fieldMappings?: Record<string, string>;
  /** Default labels */
  labels?: string[];
}

interface SheetsConfig {
  /** Spreadsheet ID */
  spreadsheetId: string;
  /** Sheet name */
  sheetName?: string;
  /** API key or OAuth token */
  apiKey?: string;
  /** OAuth client ID */
  clientId?: string;
  /** Column mappings */
  columnMappings?: Record<string, string>;
  /** Whether to append timestamp */
  appendTimestamp?: boolean;
}

interface IntegrationResult {
  /** Whether operation succeeded */
  success: boolean;
  /** Integration type */
  type: IntegrationType;
  /** Result data (e.g., Jira issue key) */
  result?: {
    issueKey?: string;
    issueUrl?: string;
    rowNumber?: number;
    spreadsheetUrl?: string;
    [key: string]: unknown;
  };
  /** Error if failed */
  error?: Error;
}
```

### Options

```typescript
interface UseIntegrationsOptions {
  /** Initial integrations configuration */
  integrations?: IntegrationConfig[];
  
  /** OAuth callback URL */
  oauthCallbackUrl?: string;
  
  /** Callback when integration is connected */
  onConnect?: (type: IntegrationType) => void;
  
  /** Callback when integration is disconnected */
  onDisconnect?: (type: IntegrationType) => void;
  
  /** Callback on submission success */
  onSubmitSuccess?: (result: IntegrationResult) => void;
  
  /** Callback on submission error */
  onSubmitError?: (type: IntegrationType, error: Error) => void;
  
  /** Whether to persist configurations */
  persist?: boolean;
  
  /** Storage key for persistence */
  storageKey?: string;
}
```

### Return Value

```typescript
interface UseIntegrationsReturn {
  /** All configured integrations */
  integrations: IntegrationConfig[];
  
  /** Currently connected/enabled integrations */
  connectedIntegrations: IntegrationConfig[];
  
  /** Whether any integration is loading/connecting */
  isLoading: boolean;
  
  /** Jira-specific state and methods */
  jira: {
    isConnected: boolean;
    isConnecting: boolean;
    config: JiraConfig | null;
    projects: JiraProject[];
    issueTypes: JiraIssueType[];
    connect: (config: JiraConfig) => Promise<void>;
    disconnect: () => void;
    updateConfig: (updates: Partial<JiraConfig>) => void;
    fetchProjects: () => Promise<JiraProject[]>;
    fetchIssueTypes: (projectKey: string) => Promise<JiraIssueType[]>;
  };
  
  /** Google Sheets-specific state and methods */
  sheets: {
    isConnected: boolean;
    isConnecting: boolean;
    config: SheetsConfig | null;
    connect: (config: SheetsConfig) => Promise<void>;
    disconnect: () => void;
    updateConfig: (updates: Partial<SheetsConfig>) => void;
    verifySpreadsheet: (spreadsheetId: string) => Promise<boolean>;
  };
  
  /** Add a new integration */
  addIntegration: (config: IntegrationConfig) => void;
  
  /** Remove an integration */
  removeIntegration: (type: IntegrationType) => void;
  
  /** Update integration config */
  updateIntegration: (type: IntegrationType, updates: Partial<IntegrationConfig>) => void;
  
  /** Enable an integration */
  enableIntegration: (type: IntegrationType) => void;
  
  /** Disable an integration */
  disableIntegration: (type: IntegrationType) => void;
  
  /** Submit feedback to Jira */
  submitToJira: (data: FeedbackData) => Promise<IntegrationResult>;
  
  /** Submit feedback to Google Sheets */
  submitToSheets: (data: FeedbackData) => Promise<IntegrationResult>;
  
  /** Submit to all connected integrations */
  submitToAll: (data: FeedbackData) => Promise<IntegrationResult[]>;
  
  /** Get integration by type */
  getIntegration: (type: IntegrationType) => IntegrationConfig | undefined;
  
  /** Check if integration is connected */
  isConnected: (type: IntegrationType) => boolean;
}
```

## Usage

### Basic Setup

```tsx
import { FeedbackProvider, useIntegrations } from 'react-visual-feedback';

function App() {
  return (
    <FeedbackProvider
      integrations={{
        jira: {
          baseUrl: 'https://company.atlassian.net',
          projectKey: 'FEEDBACK',
        },
        sheets: {
          spreadsheetId: '1234567890abcdef',
          sheetName: 'Feedback',
        },
      }}
    >
      <IntegrationPanel />
      <MainApp />
    </FeedbackProvider>
  );
}
```

### Integration Status Panel

```tsx
import { useIntegrations } from 'react-visual-feedback';

function IntegrationPanel() {
  const { 
    jira, 
    sheets, 
    connectedIntegrations,
    isLoading,
  } = useIntegrations();

  return (
    <div className="integration-panel">
      <h2>Integrations</h2>
      
      {isLoading && <p>Loading...</p>}
      
      {/* Jira */}
      <div className="integration">
        <h3>Jira</h3>
        <span className={jira.isConnected ? 'connected' : 'disconnected'}>
          {jira.isConnected ? '✓ Connected' : 'Not connected'}
        </span>
        
        {jira.isConnected ? (
          <div>
            <p>Project: {jira.config?.projectKey}</p>
            <button onClick={jira.disconnect}>Disconnect</button>
          </div>
        ) : (
          <button 
            onClick={() => jira.connect({
              baseUrl: 'https://company.atlassian.net',
              projectKey: 'FEEDBACK',
              apiToken: 'your-token',
            })}
            disabled={jira.isConnecting}
          >
            {jira.isConnecting ? 'Connecting...' : 'Connect Jira'}
          </button>
        )}
      </div>

      {/* Google Sheets */}
      <div className="integration">
        <h3>Google Sheets</h3>
        <span className={sheets.isConnected ? 'connected' : 'disconnected'}>
          {sheets.isConnected ? '✓ Connected' : 'Not connected'}
        </span>
        
        {sheets.isConnected ? (
          <div>
            <p>Sheet: {sheets.config?.sheetName || 'Default'}</p>
            <button onClick={sheets.disconnect}>Disconnect</button>
          </div>
        ) : (
          <button 
            onClick={() => sheets.connect({
              spreadsheetId: '1234567890abcdef',
              sheetName: 'Feedback',
              apiKey: 'your-api-key',
            })}
            disabled={sheets.isConnecting}
          >
            {sheets.isConnecting ? 'Connecting...' : 'Connect Sheets'}
          </button>
        )}
      </div>

      <p>{connectedIntegrations.length} integration(s) connected</p>
    </div>
  );
}
```

### Jira Configuration

```tsx
import { useIntegrations } from 'react-visual-feedback';

function JiraSetup() {
  const { jira } = useIntegrations();
  const [config, setConfig] = useState({
    baseUrl: '',
    apiToken: '',
    projectKey: '',
    issueType: 'Bug',
  });

  const handleConnect = async () => {
    await jira.connect(config);
    
    // Fetch available projects and issue types
    const projects = await jira.fetchProjects();
    console.log('Available projects:', projects);
    
    if (config.projectKey) {
      const issueTypes = await jira.fetchIssueTypes(config.projectKey);
      console.log('Issue types:', issueTypes);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleConnect(); }}>
      <label>
        Jira URL:
        <input
          type="url"
          value={config.baseUrl}
          onChange={(e) => setConfig(c => ({ ...c, baseUrl: e.target.value }))}
          placeholder="https://company.atlassian.net"
        />
      </label>
      
      <label>
        API Token:
        <input
          type="password"
          value={config.apiToken}
          onChange={(e) => setConfig(c => ({ ...c, apiToken: e.target.value }))}
        />
      </label>
      
      <label>
        Project Key:
        <select 
          value={config.projectKey}
          onChange={(e) => setConfig(c => ({ ...c, projectKey: e.target.value }))}
        >
          <option value="">Select project</option>
          {jira.projects.map(project => (
            <option key={project.key} value={project.key}>
              {project.name} ({project.key})
            </option>
          ))}
        </select>
      </label>
      
      <label>
        Issue Type:
        <select
          value={config.issueType}
          onChange={(e) => setConfig(c => ({ ...c, issueType: e.target.value }))}
        >
          {jira.issueTypes.map(type => (
            <option key={type.id} value={type.name}>
              {type.name}
            </option>
          ))}
        </select>
      </label>
      
      <button type="submit" disabled={jira.isConnecting}>
        {jira.isConnecting ? 'Connecting...' : 'Connect'}
      </button>
    </form>
  );
}
```

### Submit to Integrations

```tsx
import { useIntegrations, useFeedbackSubmission } from 'react-visual-feedback';

function SubmitWithIntegrations() {
  const { submitToJira, submitToSheets, submitToAll, connectedIntegrations } = useIntegrations();
  const { submit } = useFeedbackSubmission();

  const handleSubmit = async (feedbackData: FeedbackData) => {
    // Option 1: Submit to all connected integrations
    const results = await submitToAll(feedbackData);
    
    // Option 2: Submit to specific integrations
    // const jiraResult = await submitToJira(feedbackData);
    // const sheetsResult = await submitToSheets(feedbackData);

    // Show results
    for (const result of results) {
      if (result.success) {
        if (result.type === 'jira') {
          toast.success(`Created Jira issue: ${result.result?.issueKey}`);
        } else if (result.type === 'sheets') {
          toast.success(`Added to spreadsheet row ${result.result?.rowNumber}`);
        }
      } else {
        toast.error(`Failed to submit to ${result.type}: ${result.error?.message}`);
      }
    }
  };

  return (
    <FeedbackForm 
      onSubmit={handleSubmit}
      integrations={connectedIntegrations.map(i => i.type)}
    />
  );
}
```

### With OAuth Flow

```tsx
import { useIntegrations } from 'react-visual-feedback';

function OAuthIntegration() {
  const { jira, sheets } = useIntegrations({
    oauthCallbackUrl: `${window.location.origin}/oauth/callback`,
    onConnect: (type) => {
      console.log(`${type} connected successfully`);
    },
    onDisconnect: (type) => {
      console.log(`${type} disconnected`);
    },
  });

  const handleJiraOAuth = async () => {
    // This will redirect to Jira OAuth consent page
    await jira.connect({
      baseUrl: 'https://company.atlassian.net',
      clientId: 'your-oauth-client-id',
      projectKey: 'FEEDBACK',
    });
  };

  const handleSheetsOAuth = async () => {
    await sheets.connect({
      spreadsheetId: '1234567890abcdef',
      clientId: 'your-google-client-id',
    });
  };

  return (
    <div>
      <button onClick={handleJiraOAuth}>
        Connect with Jira (OAuth)
      </button>
      <button onClick={handleSheetsOAuth}>
        Connect with Google Sheets (OAuth)
      </button>
    </div>
  );
}

// OAuth callback handler component
function OAuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    
    if (code && state) {
      // Exchange code for token and complete connection
      handleOAuthCallback(code, state);
    }
  }, []);

  return <div>Completing authentication...</div>;
}
```

### Custom Field Mappings

```tsx
import { useIntegrations } from 'react-visual-feedback';

function CustomJiraMapping() {
  const { jira } = useIntegrations();

  const handleConnect = () => {
    jira.connect({
      baseUrl: 'https://company.atlassian.net',
      projectKey: 'FEEDBACK',
      apiToken: 'token',
      fieldMappings: {
        // Map feedback fields to Jira custom fields
        'browser': 'customfield_10001',
        'os': 'customfield_10002',
        'component': 'customfield_10003',
        'severity': 'customfield_10004',
      },
      labels: ['user-feedback', 'from-widget'],
      issueType: 'Bug',
    });
  };

  return <button onClick={handleConnect}>Connect with Custom Fields</button>;
}
```

### Persistent Configuration

```tsx
import { useIntegrations } from 'react-visual-feedback';

function PersistentIntegrations() {
  const integrations = useIntegrations({
    persist: true,
    storageKey: 'app-integrations',
    onConnect: (type) => {
      console.log(`${type} config will be saved to localStorage`);
    },
  });

  // Configurations are automatically restored on mount
  // and saved whenever they change

  return (
    <div>
      {integrations.connectedIntegrations.length === 0 ? (
        <p>No integrations configured. Set up below:</p>
      ) : (
        <p>
          {integrations.connectedIntegrations.length} integration(s) 
          loaded from storage
        </p>
      )}
      <IntegrationSetup {...integrations} />
    </div>
  );
}
```

## Testing

```tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { useIntegrations } from 'react-visual-feedback';

describe('useIntegrations', () => {
  test('starts with no connected integrations', () => {
    const { result } = renderHook(() => useIntegrations());
    expect(result.current.connectedIntegrations).toHaveLength(0);
    expect(result.current.jira.isConnected).toBe(false);
    expect(result.current.sheets.isConnected).toBe(false);
  });

  test('connects to Jira', async () => {
    const onConnect = vi.fn();
    const { result } = renderHook(() =>
      useIntegrations({ onConnect })
    );

    await act(async () => {
      await result.current.jira.connect({
        baseUrl: 'https://test.atlassian.net',
        projectKey: 'TEST',
        apiToken: 'token',
      });
    });

    expect(result.current.jira.isConnected).toBe(true);
    expect(result.current.jira.config?.projectKey).toBe('TEST');
    expect(onConnect).toHaveBeenCalledWith('jira');
  });

  test('disconnects from integration', () => {
    const onDisconnect = vi.fn();
    const { result } = renderHook(() =>
      useIntegrations({ onDisconnect })
    );

    // First connect
    act(() => {
      result.current.jira.connect({
        baseUrl: 'https://test.atlassian.net',
        projectKey: 'TEST',
        apiToken: 'token',
      });
    });

    // Then disconnect
    act(() => {
      result.current.jira.disconnect();
    });

    expect(result.current.jira.isConnected).toBe(false);
    expect(onDisconnect).toHaveBeenCalledWith('jira');
  });

  test('submits to all connected integrations', async () => {
    const { result } = renderHook(() => useIntegrations());

    // Connect both
    await act(async () => {
      await result.current.jira.connect({
        baseUrl: 'https://test.atlassian.net',
        projectKey: 'TEST',
        apiToken: 'token',
      });
      await result.current.sheets.connect({
        spreadsheetId: '123',
        apiKey: 'key',
      });
    });

    // Submit to all
    let results: IntegrationResult[];
    await act(async () => {
      results = await result.current.submitToAll({
        type: 'bug',
        title: 'Test Bug',
      });
    });

    expect(results).toHaveLength(2);
  });

  test('handles submission errors', async () => {
    const onSubmitError = vi.fn();
    const { result } = renderHook(() =>
      useIntegrations({ onSubmitError })
    );

    await act(async () => {
      await result.current.jira.connect({
        baseUrl: 'https://test.atlassian.net',
        projectKey: 'TEST',
        apiToken: 'invalid-token',
      });
    });

    await act(async () => {
      const resultItem = await result.current.submitToJira({
        type: 'bug',
        title: 'Test',
      });
      
      if (!resultItem.success) {
        expect(onSubmitError).toHaveBeenCalled();
      }
    });
  });

  test('updates integration config', () => {
    const { result } = renderHook(() => useIntegrations());

    act(() => {
      result.current.jira.connect({
        baseUrl: 'https://test.atlassian.net',
        projectKey: 'OLD',
        apiToken: 'token',
      });
    });

    act(() => {
      result.current.jira.updateConfig({ projectKey: 'NEW' });
    });

    expect(result.current.jira.config?.projectKey).toBe('NEW');
  });
});
```

---

*Documentation compiled by GitHub Copilot*  
*For project: react-visual-feedback*
