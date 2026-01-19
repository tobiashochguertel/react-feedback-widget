# @react-visual-feedback/webui

> Admin dashboard for managing visual feedback - view, filter, and manage feedback submissions with real-time updates.

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build
```

## ✨ Features

- 📊 **Dashboard** - Overview of feedback statistics and recent submissions
- 📋 **Feedback List** - Filter, search, and sort feedback items
- 🔍 **Detail View** - View screenshots, recordings, console logs, and network requests
- 🎥 **Video Playback** - Watch screen recordings with synced event logs
- 🔄 **Real-time Updates** - WebSocket integration for live feedback notifications
- 🌓 **Dark/Light Mode** - Full theme support
- 🔐 **Authentication** - API key-based authentication

## 📦 Tech Stack

- **Framework:** React 18.3 + Vite 7.3
- **State Management:** Zustand 5.0, TanStack Query 5.90
- **Routing:** React Router 7.12
- **Styling:** Tailwind CSS 4.1
- **Testing:** Vitest 4.0, Playwright 1.57

## 🔧 Configuration

### Environment Variables

| Variable                   | Description               | Default                 |
| -------------------------- | ------------------------- | ----------------------- |
| `VITE_API_URL`             | Feedback server API URL   | `http://localhost:3001` |
| `VITE_WS_URL`              | WebSocket server URL      | `ws://localhost:3001`   |
| `VITE_AUTH_ENABLED`        | Enable authentication     | `true`                  |

### Development

```bash
# Start dev server with hot reload
bun run dev

# Run tests
bun run test

# Run E2E tests
bun run test:e2e

# Type check
bun run type-check
```

## 🐳 Docker

Run the WebUI in a Docker container.

### Quick Start

```bash
# Using Taskfile (recommended)
task docker:build
task docker:run

# Or directly with Docker Compose
docker compose up -d
```

### Build Commands

```bash
# Build the Docker image
docker build -t feedback-server-webui:latest .

# Run standalone container
docker run -d -p 5173:5173 \
  -e VITE_API_URL=http://localhost:3001 \
  feedback-server-webui:latest
```

### Environment Variables

| Variable           | Description           | Default                 |
| ------------------ | --------------------- | ----------------------- |
| `NODE_ENV`         | Build environment     | `production`            |
| `PORT`             | Server port           | `5173`                  |
| `VITE_API_URL`     | Feedback API URL      | `http://localhost:3001` |
| `VITE_WS_URL`      | WebSocket URL         | `ws://localhost:3001`   |
| `VITE_AUTH_ENABLED`| Enable authentication | `true`                  |

### Docker Compose

```bash
# Start with dependencies
docker compose up -d

# View logs
docker compose logs -f

# Stop and remove
docker compose down
```

### Full Stack Deployment

To run the WebUI with the feedback server and database:

```bash
# From repository root
docker compose up -d

# Access WebUI at http://localhost:5173
# Access API at http://localhost:3001
```

> **📖 Full Deployment Guide:** See [docs/deployment/README.md](../../docs/deployment/README.md) for complete Docker deployment documentation.

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── Layout.tsx      # Main layout with navigation
│   ├── DataTable.tsx   # Sortable, filterable table
│   ├── FilterBar.tsx   # Filter controls
│   ├── StatusBadge.tsx # Status indicator
│   └── ...
├── pages/              # Route pages
│   ├── Dashboard.tsx   # Statistics overview
│   ├── FeedbackList.tsx # Feedback listing
│   ├── FeedbackDetail.tsx # Detail view
│   ├── Login.tsx       # Authentication
│   └── Settings.tsx    # User preferences
├── stores/             # Zustand state stores
│   ├── auth.ts         # Authentication state
│   └── ui.ts           # UI preferences
├── hooks/              # Custom React hooks
│   └── useApi.ts       # API integration hooks
├── lib/                # Utilities
│   └── api/
│       └── client.ts   # API client
├── App.tsx             # Main app with routing
├── main.tsx            # Entry point
└── index.css           # Tailwind styles
```

## 🧪 Testing

```bash
# Run unit tests
bun run test

# Run with coverage
bun run test:coverage

# Run E2E tests
bun run test:e2e

# Run E2E tests with UI
bun run test:e2e:ui
```

## 🔗 Related

- [react-visual-feedback](../react-visual-feedback) - React widget for collecting feedback
- [feedback-server](../feedback-server) - Backend API server
- [feedback-server-cli](../feedback-server-cli) - Command-line interface

## 📄 License

MIT © React Visual Feedback Contributors
