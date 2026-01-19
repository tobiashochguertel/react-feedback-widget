# React Visual Feedback

**[Live Demo](https://react-library-demo-rosy.vercel.app/)** | **[Documentation](./docs/README.md)**

A powerful, visual feedback collection tool for React applications with screen recording, session replay, and an integrated dashboard for managing user feedback. **Now fully typed with TypeScript!**

## 🎉 TypeScript Support

This library is written in TypeScript and provides:

- **Full type definitions** - All components, hooks, and utilities are fully typed
- **Strict mode compatible** - Works with `strict: true` in your `tsconfig.json`
- **IntelliSense support** - Excellent autocomplete and type hints in your IDE
- **Type exports** - All types are exported for use in your application

## 🚀 Quick Start

```bash
npm install react-visual-feedback react react-dom styled-components
```

```tsx
import { FeedbackProvider, FeedbackData } from "react-visual-feedback";

function App(): React.ReactElement {
  const handleSubmit = async (data: FeedbackData): Promise<void> => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  return (
    <FeedbackProvider onSubmit={handleSubmit}>
      <YourApp />
    </FeedbackProvider>
  );
}
```

## ✨ Features

- ✅ **Visual Element Selection** - Click any element with hover highlighting
- 📸 **Screenshot Capture** - Automatic pixel-perfect screenshots
- 🎥 **Screen Recording** - Record with audio + console/network logs
- 📝 **Manual Feedback** - Quick feedback via `Alt+A`
- 🎨 **Canvas Drawing** - Annotate screenshots
- ⚛️ **React Component Detection** - Auto-detect component names & source files
- 📊 **Professional Dashboard** - Manage feedback with status tracking
- 🔍 **Session Replay** - Playback recordings with synced event logs
- 🌓 **Dark/Light Mode** - Full theme support
- 🔌 **Integrations** - Jira, Google Sheets, Zapier support

## 📚 Documentation

**Comprehensive documentation available in [`./docs`](./docs/README.md)**

### Getting Started

- [Installation](./docs/getting-started/installation.md)
- [Quick Start Guide](./docs/getting-started/quick-start.md)
- [Next.js Setup](./docs/getting-started/nextjs.md)

### Architecture & Core Concepts

- [Architecture Overview](./docs/architecture/README.md) - System design and data flow
- [Hooks Reference](./docs/hooks/README.md) - All available hooks
- [Services Reference](./docs/services/README.md) - Service layer documentation

### Features

- [Keyboard Shortcuts](./docs/features/keyboard-shortcuts.md)
- [TypeScript Documentation](./docs/original-readme-with-typescript.md)

### Integrations

- [Integration Overview](./docs/integrations/README.md) - Jira, Sheets, Custom
- [Jira Integration](./docs/integrations/jira.md)
- [Google Sheets](./docs/integrations/sheets.md)
- [Server-Side Handlers](./docs/integrations/server.md)
- [Custom Integrations](./docs/integrations/custom.md)

## 🎣 Hooks

React Visual Feedback provides hooks for fine-grained control:

```tsx
import {
  useActivation, // Control feedback mode activation
  useDashboard, // Control dashboard visibility
  useRecording, // Screen recording controls
  useScreenCapture, // Screenshot capture
  useElementSelection, // DOM element selection
  useKeyboardShortcuts, // Custom shortcuts
  useFeedbackSubmission, // Submission queue & retry
  useIntegrations, // Jira/Sheets integration
  useTheme, // Theme access
} from "react-visual-feedback";

function MyComponent() {
  const { activate, deactivate, isActive } = useActivation();
  const { startRecording, stopRecording, isRecording } = useRecording();

  return (
    <button onClick={() => (isActive ? deactivate() : activate())}>
      {isActive ? "Deactivate" : "Activate"} Feedback
    </button>
  );
}
```

See [Hooks Documentation](./docs/hooks/README.md) for complete API reference.

## 🔌 Integrations

Connect to external services:

```tsx
<FeedbackProvider
  integrations={{
    jira: {
      endpoint: "/api/feedback/jira",
      mode: "server",
    },
    sheets: {
      endpoint: "/api/feedback/sheets",
      mode: "server",
    },
  }}
>
  {children}
</FeedbackProvider>
```

Server-side handlers keep credentials secure:

```typescript
// app/api/feedback/jira/route.ts
import { createJiraNextAppHandler } from "react-visual-feedback/server";

export const POST = createJiraNextAppHandler({
  host: process.env.JIRA_HOST!,
  email: process.env.JIRA_EMAIL!,
  apiToken: process.env.JIRA_API_TOKEN!,
  projectKey: "FEEDBACK",
});
```

See [Integrations Guide](./docs/integrations/README.md) for details.

## ⌨️ Keyboard Shortcuts

| Shortcut      | Action                                     |
| ------------- | ------------------------------------------ |
| `Alt+Q`       | Activate feedback mode (element selection) |
| `Alt+A`       | Open manual feedback form                  |
| `Alt+W`       | Start screen recording                     |
| `Alt+Shift+Q` | Open dashboard                             |
| `Esc`         | Cancel/close                               |

## 🔒 Security & Privacy

This widget is **safe and privacy-focused**:

- ✅ **No data exfiltration** - Data only goes where YOU configure
- ✅ **Local-first** - Data stored in browser localStorage by default
- ✅ **You control endpoints** - Configure your own API, Jira, or Google Sheets
- ✅ **Open source** - All code is transparent and auditable
- ✅ **MIT Licensed** - Free for commercial and personal use

### What data is collected?

Only when users submit feedback:

- User-provided feedback text
- Screenshots (if user selects an element)
- Screen recordings (if user starts recording)
- Browser metadata (viewport, userAgent, URL)
- Console/network logs (only during screen recording)

### Where does data go?

- **Your configured API endpoint** (via `onSubmit` prop)
- **Local browser storage** (if dashboard is enabled)
- **Optional integrations** (Jira/Google Sheets - only if YOU enable them)

**No third-party tracking or analytics are included in this library.**

## 📦 Installation

```bash
npm install react-visual-feedback
```

**Peer Dependencies:**

```bash
npm install react react-dom styled-components
```

## 🌐 Browser Support

- Chrome/Edge (recommended for screen recording)
- Firefox
- Safari
- Opera

## � Docker

The library can be built using Docker for CI/CD environments.

### Build Library

```bash
# Using Taskfile
task docker:build

# Or directly with Docker
docker build -t react-visual-feedback:latest .
```

### Build and Extract Artifacts

```bash
# Build and copy dist folder
docker build -t react-visual-feedback:latest .
docker create --name tmp-build react-visual-feedback:latest
docker cp tmp-build:/app/dist ./dist
docker rm tmp-build
```

### Docker Compose (for development)

```bash
# Start development build
docker compose up

# Build with no cache
docker compose build --no-cache
```

### Environment Variables

| Variable   | Description         | Default                     |
| ---------- | ------------------- | --------------------------- |
| `NODE_ENV` | Build environment   | `production`                |
| `API_URL`  | Feedback server URL | `http://localhost:3001/api` |

> **📖 Full Deployment Guide:** See [docs/deployment/README.md](../../docs/deployment/README.md) for complete Docker deployment documentation.

## �📄 License

MIT

## 👨‍💻 Author

**Murali Vvrsn Gurajapu**
Email: <murali.g@hyperverge.co>

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Star History

If you find this useful, please consider starring the repository!

---

**Made with care for better user feedback collection** 💙

For detailed documentation, visit [`./docs`](./docs/README.md)
