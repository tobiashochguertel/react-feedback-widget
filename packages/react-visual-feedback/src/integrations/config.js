/**
 * Integration Configuration & Default Mappings
 * Users can customize these by passing their own config
 */

// ============================================
// ATLASSIAN DOCUMENT FORMAT (ADF) HELPER
// ============================================

/**
 * Convert plain text to Atlassian Document Format
 * Jira Cloud requires descriptions in ADF format
 */
export function textToADF(text) {
  const lines = text.split('\n');
  const content = [];
  let currentParagraph = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      content.push({
        type: 'paragraph',
        content: currentParagraph
      });
      currentParagraph = [];
    }
  };

  lines.forEach((line, index) => {
    // Check if it's a section header (ALL CAPS)
    if (line.match(/^[A-Z][A-Z\s]+$/) && line.trim().length > 0) {
      flushParagraph();
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: line }]
      });
    } else if (line === '---') {
      // Horizontal rule
      flushParagraph();
      content.push({ type: 'rule' });
    } else if (line.trim() === '') {
      // Empty line - flush paragraph
      flushParagraph();
    } else {
      // Regular line
      if (currentParagraph.length > 0) {
        currentParagraph.push({ type: 'hardBreak' });
      }
      currentParagraph.push({ type: 'text', text: line });
    }
  });

  flushParagraph();

  return {
    type: 'doc',
    version: 1,
    content: content.length > 0 ? content : [{ type: 'paragraph', content: [{ type: 'text', text: ' ' }] }]
  };
}

// ============================================
// GOOGLE SHEETS COLUMN MAPPING
// ============================================

export const DEFAULT_SHEET_COLUMNS = {
  timestamp: {
    key: 'timestamp',
    header: 'Timestamp',
    field: 'timestamp',
    transform: (value) => value || new Date().toISOString()
  },
  id: {
    key: 'id',
    header: 'Feedback ID',
    field: 'id'
  },
  feedback: {
    key: 'feedback',
    header: 'Feedback',
    field: 'feedback'
  },
  type: {
    key: 'type',
    header: 'Type',
    field: 'type',
    transform: (value) => value || 'bug'
  },
  status: {
    key: 'status',
    header: 'Status',
    field: 'status',
    transform: (value) => value || 'new'
  },
  userName: {
    key: 'userName',
    header: 'User Name',
    field: 'userName',
    transform: (value) => value || 'Anonymous'
  },
  userEmail: {
    key: 'userEmail',
    header: 'User Email',
    field: 'userEmail',
    transform: (value) => value || ''
  },
  url: {
    key: 'url',
    header: 'Page URL',
    field: 'url'
  },
  viewport: {
    key: 'viewport',
    header: 'Viewport',
    field: 'viewport',
    transform: (value) => value ? `${value.width}x${value.height}` : ''
  },
  userAgent: {
    key: 'userAgent',
    header: 'Browser',
    field: 'userAgent',
    transform: (value) => {
      if (!value) return '';
      // Simplify user agent
      if (value.includes('Chrome')) return 'Chrome';
      if (value.includes('Firefox')) return 'Firefox';
      if (value.includes('Safari')) return 'Safari';
      if (value.includes('Edge')) return 'Edge';
      return value.substring(0, 50);
    }
  },
  screenshot: {
    key: 'screenshot',
    header: 'Screenshot',
    field: 'screenshot',
    transform: (value) => value ? 'Yes' : 'No' // Don't store base64 in sheets
  },
  video: {
    key: 'video',
    header: 'Video',
    field: 'video',
    transform: (value) => value ? 'Yes' : 'No'
  },
  elementSelector: {
    key: 'elementSelector',
    header: 'Element',
    field: 'elementInfo',
    transform: (value) => value?.selector || ''
  },
  componentName: {
    key: 'componentName',
    header: 'Component',
    field: 'elementInfo',
    transform: (value) => value?.componentStack?.[0] || ''
  },
  sourceFile: {
    key: 'sourceFile',
    header: 'Source File',
    field: 'elementInfo',
    transform: (value) => value?.sourceFile || ''
  },
  jiraKey: {
    key: 'jiraKey',
    header: 'Jira Issue',
    field: 'jiraKey',
    transform: (value) => value || ''
  }
};

// Default columns to include (order matters)
export const DEFAULT_SHEET_COLUMN_ORDER = [
  'timestamp',
  'id',
  'feedback',
  'type',
  'status',
  'userName',
  'userEmail',
  'url',
  'viewport',
  'screenshot',
  'video',
  'jiraKey'
];

// ============================================
// JIRA FIELD MAPPING
// ============================================

export const DEFAULT_JIRA_FIELDS = {
  summary: {
    key: 'summary',
    source: 'feedback',
    maxLength: 255,
    prefix: '[Feedback] ',
    transform: (data) => {
      const prefix = '[Feedback] ';
      const text = data.feedback || 'User Feedback';
      const maxLen = 255 - prefix.length;
      return prefix + (text.length > maxLen ? text.substring(0, maxLen - 3) + '...' : text);
    }
  },
  description: {
    key: 'description',
    // Build description directly - no wiki markup, clean plain text for ADF
    transform: (data) => {
      const lines = [];

      // Feedback Details
      lines.push('FEEDBACK DETAILS');
      lines.push(`Feedback: ${data.feedback || 'No feedback provided'}`);
      lines.push(`Type: ${data.type || 'bug'}`);
      lines.push(`Status: ${data.status || 'new'}`);
      lines.push('');

      // User Information
      lines.push('USER INFORMATION');
      lines.push(`Name: ${data.userName || 'Anonymous'}`);
      lines.push(`Email: ${data.userEmail || 'Not provided'}`);
      lines.push('');

      // Technical Details
      lines.push('TECHNICAL DETAILS');
      lines.push(`Page URL: ${data.url || 'N/A'}`);
      if (data.viewport) {
        lines.push(`Viewport: ${data.viewport.width}x${data.viewport.height}`);
      }
      if (data.userAgent) {
        // Simplify user agent
        let browser = data.userAgent;
        if (browser.includes('Chrome')) browser = 'Chrome';
        else if (browser.includes('Firefox')) browser = 'Firefox';
        else if (browser.includes('Safari')) browser = 'Safari';
        else if (browser.includes('Edge')) browser = 'Edge';
        lines.push(`Browser: ${browser}`);
      }

      // Element info
      if (data.elementInfo) {
        if (data.elementInfo.selector) {
          lines.push(`Element: ${data.elementInfo.selector}`);
        }
        if (data.elementInfo.componentStack?.length) {
          lines.push(`Component: ${data.elementInfo.componentStack.join(' > ')}`);
        }
        if (data.elementInfo.sourceFile) {
          lines.push(`Source: ${data.elementInfo.sourceFile}:${data.elementInfo.lineNumber || ''}`);
        }
      }
      lines.push('');

      // Attachments
      const attachments = [];
      if (data.screenshot) attachments.push('Screenshot');
      if (data.video) attachments.push('Screen Recording');
      if (attachments.length > 0) {
        lines.push('ATTACHMENTS');
        lines.push(attachments.join(', ') + ' attached');
        lines.push('');
      }

      lines.push('---');
      lines.push('Submitted via React Visual Feedback');

      return lines.join('\n');
    }
  },
  issuetype: {
    key: 'issuetype',
    // Default to 'Task' which exists in most Jira projects
    // Can be overridden via JIRA_ISSUE_TYPE env var or config
    value: 'Task',
    // Map feedback types to Jira issue types (all default to Task for compatibility)
    typeMapping: {
      bug: 'Task',
      feature: 'Task',
      improvement: 'Task',
      question: 'Task',
      other: 'Task'
    },
    transform: (data, config) => {
      // Priority: env var > config value > type mapping > default
      const envIssueType = typeof process !== 'undefined' ? process.env?.JIRA_ISSUE_TYPE : null;
      if (envIssueType) return envIssueType;
      if (config?.value && config.value !== 'Task') return config.value;
      const mapping = config?.typeMapping || DEFAULT_JIRA_FIELDS.issuetype.typeMapping;
      return mapping[data.type] || config?.value || 'Task';
    }
  },
  labels: {
    key: 'labels',
    value: ['user-feedback'],
    transform: (data, config) => {
      const labels = [...(config?.value || ['user-feedback'])];
      if (data.type) labels.push(`type-${data.type}`);
      return labels;
    }
  },
  priority: {
    key: 'priority',
    // Map to Jira priority IDs (user can customize)
    priorityMapping: {
      bug: 'High',
      feature: 'Medium',
      improvement: 'Medium',
      question: 'Low',
      other: 'Low'
    },
    transform: (data, config) => {
      const mapping = config?.priorityMapping || DEFAULT_JIRA_FIELDS.priority.priorityMapping;
      return mapping[data.type] || 'Medium';
    }
  }
};

// ============================================
// JIRA STATUS MAPPING (Bidirectional sync)
// ============================================

export const DEFAULT_JIRA_STATUS_MAPPING = {
  // Our status -> Jira status
  toJira: {
    new: 'To Do',
    open: 'To Do',
    inProgress: 'In Progress',
    underReview: 'In Review',
    onHold: 'On Hold',
    resolved: 'Done',
    closed: 'Done',
    wontFix: 'Won\'t Do'
  },
  // Jira status -> Our status
  fromJira: {
    'To Do': 'open',
    'Open': 'open',
    'In Progress': 'inProgress',
    'In Review': 'underReview',
    'On Hold': 'onHold',
    'Done': 'resolved',
    'Closed': 'closed',
    'Won\'t Do': 'wontFix',
    'Resolved': 'resolved'
  }
};

// ============================================
// INTEGRATION TYPES
// ============================================

export const INTEGRATION_TYPES = {
  JIRA: {
    SERVER: 'server',           // Our server handler
    AUTOMATION: 'jira-automation', // Jira's built-in webhooks
    ZAPIER: 'zapier'            // Zapier webhook
  },
  SHEETS: {
    SERVER: 'server',           // Our server handler (Service Account)
    OAUTH: 'oauth',             // OAuth with refresh
    APPS_SCRIPT: 'google-apps-script', // Google Apps Script
    ZAPIER: 'zapier'            // Zapier webhook
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Merge user config with defaults
 */
export function mergeSheetColumns(userColumns = {}, columnOrder = null) {
  const merged = { ...DEFAULT_SHEET_COLUMNS };

  // Apply user overrides
  Object.entries(userColumns).forEach(([key, value]) => {
    if (value === null || value === false) {
      // Remove column
      delete merged[key];
    } else if (typeof value === 'object') {
      // Merge with default
      merged[key] = { ...merged[key], ...value };
    }
  });

  // Determine column order
  const order = columnOrder || Object.keys(merged).filter(k =>
    DEFAULT_SHEET_COLUMN_ORDER.includes(k) || userColumns[k]
  );

  return { columns: merged, order };
}

/**
 * Merge user Jira config with defaults
 */
export function mergeJiraFields(userFields = {}) {
  const merged = { ...DEFAULT_JIRA_FIELDS };

  Object.entries(userFields).forEach(([key, value]) => {
    if (value === null || value === false) {
      delete merged[key];
    } else if (typeof value === 'object') {
      merged[key] = { ...merged[key], ...value };
    }
  });

  return merged;
}

/**
 * Transform feedback data to sheet row
 */
export function feedbackToSheetRow(feedbackData, config = {}) {
  const { columns, order } = mergeSheetColumns(config.columns, config.columnOrder);

  const row = order.map(key => {
    const col = columns[key];
    if (!col) return '';

    const rawValue = feedbackData[col.field];
    if (col.transform) {
      return col.transform(rawValue) || '';
    }
    return rawValue || '';
  });

  return row;
}

/**
 * Get sheet headers
 */
export function getSheetHeaders(config = {}) {
  const { columns, order } = mergeSheetColumns(config.columns, config.columnOrder);
  return order.map(key => columns[key]?.header || key);
}

/**
 * Transform feedback data to Jira issue
 */
export function feedbackToJiraIssue(feedbackData, config = {}) {
  const fields = mergeJiraFields(config.fields);

  // Get plain text description and convert to ADF
  const plainDescription = fields.description.transform(feedbackData, fields.description);
  const adfDescription = textToADF(plainDescription);

  const issue = {
    fields: {
      project: { key: config.projectKey },
      summary: fields.summary.transform(feedbackData, fields.summary),
      description: adfDescription,
      issuetype: { name: fields.issuetype.transform(feedbackData, fields.issuetype) }
    }
  };

  // Add labels if configured
  if (fields.labels) {
    issue.fields.labels = fields.labels.transform(feedbackData, fields.labels);
  }

  // Add priority if configured and user wants it
  if (config.includePriority && fields.priority) {
    issue.fields.priority = { name: fields.priority.transform(feedbackData, fields.priority) };
  }

  // Add custom fields
  if (config.customFields) {
    Object.entries(config.customFields).forEach(([fieldId, fieldConfig]) => {
      if (typeof fieldConfig === 'string') {
        issue.fields[fieldId] = feedbackData[fieldConfig];
      } else if (fieldConfig.transform) {
        issue.fields[fieldId] = fieldConfig.transform(feedbackData);
      } else if (fieldConfig.value) {
        issue.fields[fieldId] = fieldConfig.value;
      }
    });
  }

  return issue;
}

/**
 * Map Jira status to our status
 */
export function mapJiraStatusToLocal(jiraStatus, customMapping = {}) {
  const mapping = { ...DEFAULT_JIRA_STATUS_MAPPING.fromJira, ...customMapping };
  return mapping[jiraStatus] || 'open';
}

/**
 * Map our status to Jira status
 */
export function mapLocalStatusToJira(localStatus, customMapping = {}) {
  const mapping = { ...DEFAULT_JIRA_STATUS_MAPPING.toJira, ...customMapping };
  return mapping[localStatus] || 'To Do';
}
