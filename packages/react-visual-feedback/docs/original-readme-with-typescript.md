# React Visual Feedback (TypeScript)

> **Note:** This documentation reflects the TypeScript-migrated codebase. For the original JavaScript documentation, see [original-readme.md](./original-readme.md).

**[Live Demo](https://react-library-demo-rosy.vercel.app/)**

A powerful, visual feedback collection tool for React applications with screen recording, session replay, and an integrated dashboard for managing user feedback. **Now fully typed with TypeScript!**

## TypeScript Support

This library is written in TypeScript and provides:

- **Full type definitions** - All components, hooks, and utilities are fully typed
- **Strict mode compatible** - Works with `strict: true` in your `tsconfig.json`
- **IntelliSense support** - Excellent autocomplete and type hints in your IDE
- **Type exports** - All types are exported for use in your application

## Features

### Feedback Collection

- **Visual Element Selection** - Click any element with hover highlighting
- **Screenshot Capture** - Automatic pixel-perfect screenshot with CSS rendering
- **Screen Recording** - Record screen with audio and capture console/network logs
- **Manual Feedback** - `Alt+A` to open form directly without selection
- **File Attachments** - Drag & drop support for Images, Videos, PDFs, and other files
- **Canvas Drawing** - Annotate screenshots with drawings and highlights
- **React Component Detection** - Automatically detects React component names and source files
- **Keyboard Shortcuts** - `Alt+Q` (Selection), `Alt+A` (Manual), `Alt+W` (Record), `Esc` (Cancel)

### Session Replay

- **Video Playback** - Watch recorded user sessions with fullscreen support
- **Console Logs** - See console.log, errors, warnings synced with video timeline
- **Network Requests** - Track API calls and responses
- **Video Mode** - Fullscreen playback with synced logs panel (scrollable even when paused)
- **Expandable Logs Panel** - Slide-out panel on the right side (customizable)

### Screen Recording

- **Draggable Indicator** - Recording overlay can be moved around the screen
- **Audio Capture** - Record microphone and system audio (mixed)
- **IndexedDB Storage** - Large videos stored locally to prevent quota errors
- **Download Videos** - Export recordings as WebM files

### Dashboard

- **Professional UI** - Clean 700px slide-out panel
- **Developer Mode** - Full technical details (source file, component stack, viewport)
- **User Mode** - Simplified view for end users
- **8 Status Options** - New, Open, In Progress, Under Review, On Hold, Resolved, Closed, Won't Fix
- **Status Callbacks** - Sync with your database on status changes
- **Search** - Search through feedback by title, description, or user

### Updates Modal

- **What's New** - Display product updates, bug fixes, and new features to users
- **Filter Tabs** - Filter by Fixed or New Feature
- **Smooth Animations** - Beautiful fade-in animations with staggered item entry
- **Mobile Responsive** - Works as a centered popup on all screen sizes
- **Dark/Light Mode** - Full theme support

### Theming

- **Light/Dark Mode** - Full theme support
- **styled-components** - No external CSS required

## Installation

```bash
npm install react-visual-feedback
```

**Peer Dependencies:**

```bash
npm install react react-dom styled-components
```

**TypeScript Types (included):**

No additional `@types/*` packages needed - types are bundled with the library!

## Quick Start

### Basic Usage

```tsx
import React from 'react';
import { FeedbackProvider, FeedbackData } from 'react-visual-feedback';

function App(): React.ReactElement {
  const handleFeedbackSubmit = async (feedbackData: FeedbackData): Promise<void> => {
    console.log('Feedback received:', feedbackData);
    // feedbackData.attachment contains any manually uploaded file
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });
  };

  return (
    <FeedbackProvider onSubmit={handleFeedbackSubmit}>
      <YourApp />
    </FeedbackProvider>
  );
}
```

### With Dashboard & Screen Recording

```tsx
import React from 'react';
import { 
  FeedbackProvider, 
  useFeedback, 
  FeedbackData,
  StatusChangeParams 
} from 'react-visual-feedback';

function FeedbackButtons(): React.ReactElement {
  const { isActive, setIsActive, setIsDashboardOpen, startRecording } = useFeedback();

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', gap: 10 }}>
      <button onClick={() => setIsDashboardOpen(true)}>Dashboard</button>
      <button onClick={startRecording}>Record Screen</button>
      <button onClick={() => setIsActive(!isActive)}>
        {isActive ? 'Cancel' : 'Report Issue'}
      </button>
    </div>
  );
}

function App(): React.ReactElement {
  const handleFeedbackSubmit = async (feedbackData: FeedbackData): Promise<void> => {
    // feedbackData contains: feedback, screenshot, video, attachment, eventLogs, elementInfo, etc.
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });
  };

  const handleStatusChange = async ({ id, status, comment }: StatusChangeParams): Promise<void> => {
    await fetch(`/api/feedback/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, comment })
    });
  };

  return (
    <FeedbackProvider
      onSubmit={handleFeedbackSubmit}
      onStatusChange={handleStatusChange}
      dashboard={true}
      isDeveloper={true}
      userName="John Doe"
      userEmail="john@example.com"
      mode="light"
      defaultOpen={false}
    >
      <YourApp />
      <FeedbackButtons />
    </FeedbackProvider>
  );
}
```

## Type Definitions

### Core Types

```typescript
import type {
  // Feedback data types
  FeedbackData,
  FeedbackType,
  FeedbackStatus,
  StatusChangeParams,
  
  // Event log types
  EventLog,
  EventLogType,
  
  // Element info types
  ElementInfo,
  ElementPosition,
  ElementStyles,
  
  // Status configuration types
  StatusConfig,
  StatusConfigs,
  
  // Update modal types
  Update,
  UpdateType,
  
  // Integration types
  IntegrationConfig,
  IntegrationClient,
  
  // Component prop types
  FeedbackProviderProps,
  FeedbackDashboardProps,
  FeedbackModalProps,
  SessionReplayProps,
  UpdatesModalProps,
  
  // Hook types
  FeedbackContextValue,
  
  // Theme types
  ThemeMode,
  Theme
} from 'react-visual-feedback';
```

### FeedbackData Interface

```typescript
interface FeedbackData {
  id: string;                    // UUID
  feedback: string;              // User's feedback text
  type: FeedbackType;            // 'bug' | 'feature' | 'improvement' | 'question' | 'other'
  userName: string;
  userEmail: string | null;
  status: FeedbackStatus;        // 'new' | 'open' | 'inProgress' | etc.
  timestamp: string;             // ISO 8601
  url: string;                   // Page URL
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };

  // Attachments
  screenshot?: string;           // Base64 PNG data URL (Automatic)
  video?: string;                // Base64 webm data URL (Recording)
  attachment?: File;             // Generic file (Manual Upload)

  eventLogs?: EventLog[];        // Console/network logs

  // Element info (for element selection)
  elementInfo?: ElementInfo;
}

interface ElementInfo {
  tagName: string;
  id: string;
  className: string;
  selector: string;
  text: string;
  position: ElementPosition;
  styles: ElementStyles;
  sourceFile?: string;           // React source file path
  lineNumber?: number;
  columnNumber?: number;
  componentStack?: string[];     // React component hierarchy
}

interface EventLog {
  timestamp: number;             // Milliseconds from recording start
  type: EventLogType;            // 'log' | 'warn' | 'error' | 'info' | 'network'
  message: string;
  data?: unknown;
}
```

## API Reference

### FeedbackProvider Props

```typescript
interface FeedbackProviderProps {
  children: React.ReactNode;
  onSubmit: (data: FeedbackData) => Promise<void>;
  onStatusChange?: (params: StatusChangeParams) => void;
  dashboard?: boolean;
  dashboardData?: FeedbackData[];
  isDeveloper?: boolean;
  isUser?: boolean;
  userName?: string;
  userEmail?: string;
  mode?: ThemeMode;              // 'light' | 'dark'
  isActive?: boolean;
  onActiveChange?: (active: boolean) => void;
  defaultOpen?: boolean;
}
```

| Prop             | Type                                       | Default       | Description                                    |
|------------------|-------------------------------------------|---------------|------------------------------------------------|
| `onSubmit`       | `(data: FeedbackData) => Promise<void>`   | required      | Callback when feedback is submitted            |
| `onStatusChange` | `(params: StatusChangeParams) => void`    | -             | Callback when status changes                   |
| `dashboard`      | `boolean`                                 | `false`       | Enable dashboard feature                       |
| `dashboardData`  | `FeedbackData[]`                          | -             | Custom data (uses localStorage if undefined)   |
| `isDeveloper`    | `boolean`                                 | `false`       | Enable developer mode                          |
| `isUser`         | `boolean`                                 | `true`        | Enable user mode                               |
| `userName`       | `string`                                  | `'Anonymous'` | User name                                      |
| `userEmail`      | `string`                                  | `null`        | User email                                     |
| `mode`           | `'light' \| 'dark'`                       | `'light'`     | Theme mode                                     |
| `isActive`       | `boolean`                                 | -             | Controlled active state                        |
| `onActiveChange` | `(active: boolean) => void`               | -             | Callback for controlled mode                   |
| `defaultOpen`    | `boolean`                                 | `false`       | Open manual feedback form immediately on mount |

### FeedbackDashboard Props

```typescript
interface FeedbackDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  data?: FeedbackData[];
  isDeveloper?: boolean;
  isUser?: boolean;
  onStatusChange?: (params: StatusChangeParams) => void;
  mode?: ThemeMode;
  isLoading?: boolean;
  onRefresh?: () => void;
  title?: string;
  statuses?: StatusConfigs;
  acceptableStatuses?: string[];
  showAllStatuses?: boolean;
  error?: string | null;
}
```

### useFeedback Hook

```typescript
interface FeedbackContextValue {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  setIsDashboardOpen: (open: boolean) => void;
  startRecording: () => void;
}

// Usage
const {
  isActive,           // boolean - feedback mode active
  setIsActive,        // (active: boolean) => void
  setIsDashboardOpen, // (open: boolean) => void
  startRecording      // () => void - start screen recording
} = useFeedback();
```

### SessionReplay Props

```typescript
interface SessionReplayProps {
  videoSrc: string;              // Video source (data URL, blob URL, or http URL)
  eventLogs?: EventLog[];        // Array of log objects with timestamp
  mode?: ThemeMode;              // Theme mode
  showLogsButton?: boolean;      // Show/hide logs toggle button
  logsPanelWidth?: string;       // Width of logs panel
  defaultLogsOpen?: boolean;     // Start with logs panel open
}
```

```tsx
import { SessionReplay, EventLog } from 'react-visual-feedback';

const logs: EventLog[] = [
  { timestamp: 1000, type: 'log', message: 'User clicked button' },
  { timestamp: 2500, type: 'network', message: 'GET /api/data' }
];

<SessionReplay
  videoSrc={videoDataUrl}
  eventLogs={logs}
  mode="light"
  showLogsButton={true}
  logsPanelWidth="320px"
  defaultLogsOpen={false}
/>
```

### UpdatesModal Props

```typescript
interface Update {
  id: string;
  type: UpdateType;              // 'solved' | 'new_feature'
  title: string;
  description?: string;
  date?: string;
  version?: string;
  category?: string;
}

interface UpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  updates: Update[];
  title?: string;
  mode?: ThemeMode;
}
```

```tsx
import { UpdatesModal, Update } from 'react-visual-feedback';

const updates: Update[] = [
  {
    id: '1',
    type: 'solved',
    title: 'Fixed login page performance issues',
    description: 'Optimized the authentication flow, reducing load time by 40%',
    date: '2024-11-30',
    version: '2.1.0',
    category: 'Performance'
  },
  {
    id: '2',
    type: 'new_feature',
    title: 'Dark mode support added',
    description: 'Full dark mode support across all components with smooth transitions',
    date: '2024-11-28',
    version: '2.1.0',
    category: 'Feature'
  }
];

<UpdatesModal
  isOpen={showUpdates}
  onClose={() => setShowUpdates(false)}
  updates={updates}
  title="What's New"
  mode="light"
/>
```

## Custom Status Configuration

### Type-Safe Status Definitions

```typescript
import { 
  FeedbackDashboard, 
  StatusConfigs,
  StatusConfig 
} from 'react-visual-feedback';

const myStatuses: StatusConfigs = {
  open: {
    label: 'Open',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    textColor: '#92400e',
    icon: 'AlertCircle'
  },
  in_progress: {
    label: 'In Progress',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    textColor: '#1e40af',
    icon: 'Play'
  },
  resolved: {
    label: 'Resolved',
    color: '#10b981',
    bgColor: '#d1fae5',
    textColor: '#065f46',
    icon: 'CheckCircle'
  }
};

// Option 1: Show all statuses defined in myStatuses
<FeedbackDashboard
  isOpen={true}
  onClose={() => {}}
  statuses={myStatuses}
/>

// Option 2: Show only specific statuses
const acceptableStatuses: string[] = ['open', 'resolved'];

<FeedbackDashboard
  isOpen={true}
  onClose={() => {}}
  statuses={myStatuses}
  acceptableStatuses={acceptableStatuses}
/>
```

## Keyboard Shortcuts

| Shortcut      | Action                                     |
|---------------|--------------------------------------------|
| `Alt+Q`       | Activate feedback mode (element selection) |
| `Alt+A`       | Open Manual Feedback form                  |
| `Alt+W`       | Start screen recording                     |
| `Alt+Shift+Q` | Open dashboard                             |
| `Esc`         | Cancel/close                               |

## All Exports

```typescript
import {
  // Core components
  FeedbackProvider,
  FeedbackModal,
  FeedbackDashboard,
  FeedbackTrigger,
  CanvasOverlay,
  UpdatesModal,

  // Hooks
  useFeedback,

  // Status components
  StatusBadge,
  StatusDropdown,

  // Status utilities
  getStatusData,
  getIconComponent,
  normalizeStatusKey,
  DEFAULT_STATUSES,

  // Storage utilities
  saveFeedbackToLocalStorage,

  // Theme utilities
  getTheme,
  lightTheme,
  darkTheme,

  // General utilities
  getElementInfo,
  captureElementScreenshot,
  getReactComponentInfo,
  formatPath,

  // Type exports
  type FeedbackData,
  type FeedbackType,
  type FeedbackStatus,
  type StatusChangeParams,
  type EventLog,
  type EventLogType,
  type ElementInfo,
  type StatusConfig,
  type StatusConfigs,
  type Update,
  type UpdateType,
  type FeedbackProviderProps,
  type FeedbackDashboardProps,
  type SessionReplayProps,
  type UpdatesModalProps,
  type FeedbackContextValue,
  type ThemeMode,
  type Theme
} from 'react-visual-feedback';
```

## Next.js Integration

### App Router (Server Components)

```tsx
// app/providers.tsx
'use client';

import { FeedbackProvider, FeedbackData } from 'react-visual-feedback';

interface FeedbackProviderClientProps {
  children: React.ReactNode;
}

export function FeedbackProviderClient({ children }: FeedbackProviderClientProps): React.ReactElement {
  const handleSubmit = async (data: FeedbackData): Promise<void> => {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  };

  return (
    <FeedbackProvider 
      onSubmit={handleSubmit}
      dashboard={true}
      mode="light"
    >
      {children}
    </FeedbackProvider>
  );
}
```

```tsx
// app/layout.tsx
import { FeedbackProviderClient } from './providers';

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}): React.ReactElement {
  return (
    <html>
      <body>
        <FeedbackProviderClient>
          {children}
        </FeedbackProviderClient>
      </body>
    </html>
  );
}
```

## Browser Support

- Chrome/Edge (recommended for screen recording)
- Firefox
- Safari
- Opera

## Migration from JavaScript

If you're migrating from the JavaScript version:

1. **No breaking changes** - All APIs remain the same
2. **Add types gradually** - TypeScript is optional; JavaScript usage still works
3. **Import types** - Use `import type { ... }` for type-only imports
4. **Enable strict mode** - The library is strict-mode compatible

## License

MIT

## Author

**Murali Vvrsn Gurajapu**
Email: <murali.g@hyperverge.co>

---

Made with care for better user feedback collection ❤️

---

**TypeScript migration completed:** January 2025
