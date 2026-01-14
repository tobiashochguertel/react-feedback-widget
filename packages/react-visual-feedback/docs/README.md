# React Visual Feedback - Documentation

**[Live Demo](https://react-library-demo-rosy.vercel.app/)**

A powerful, visual feedback collection tool for React applications with screen recording, session replay, and an integrated dashboard for managing user feedback.

## 📚 Documentation Index

### Getting Started

- [Installation](./getting-started/installation.md)
- [Quick Start](./getting-started/quick-start.md)
- [Next.js Setup](./getting-started/nextjs.md)

### Features

- [Visual Element Selection](./features/element-selection.md)
- [Screenshot Capture](./features/screenshots.md)
- [Screen Recording & Session Replay](./features/screen-recording.md)
- [Dashboard](./features/dashboard.md)
- [Updates Modal](./features/updates-modal.md)
- [Keyboard Shortcuts](./features/keyboard-shortcuts.md)

### Integrations

- [Jira Integration](./integrations/jira.md)
- [Google Sheets Integration](./integrations/google-sheets.md)
- [Custom Integrations](./integrations/custom.md)

### API Reference

- [FeedbackProvider API](./api/feedback-provider.md)
- [FeedbackDashboard API](./api/feedback-dashboard.md)
- [useFeedback Hook](./api/use-feedback-hook.md)
- [Data Structures](./api/data-structures.md)
- [All Exports](./api/exports.md)

### Examples

- [Database Schemas](./examples/database-schemas.md)
- [API Endpoints](./examples/api-endpoints.md)
- [Custom Status System](./examples/custom-statuses.md)

## Features Overview

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

## Browser Support

- Chrome/Edge (recommended for screen recording)
- Firefox
- Safari
- Opera

## License

MIT

## Author

**Murali Vvrsn Gurajapu**
Email: <murali.g@hyperverge.co>

---

Made with care for better user feedback collection
