# React Visual Feedback

**[Live Demo](https://react-library-demo-rosy.vercel.app/)** | **[Documentation](./docs/README.md)**

A powerful, visual feedback collection tool for React applications with screen recording, session replay, and an integrated dashboard for managing user feedback.

## 🚀 Quick Start

```bash
npm install react-visual-feedback react react-dom styled-components
```

```jsx
import { FeedbackProvider } from 'react-visual-feedback';

function App() {
  return (
    <FeedbackProvider onSubmit={async (data) => {
      await fetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }}>
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

### Features
- [Keyboard Shortcuts](./docs/features/keyboard-shortcuts.md)
- More documentation coming soon...

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Q` | Activate feedback mode (element selection) |
| `Alt+A` | Open manual feedback form |
| `Alt+W` | Start screen recording |
| `Alt+Shift+Q` | Open dashboard |
| `Esc` | Cancel/close |

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

## 📄 License

MIT

## 👨‍💻 Author

**Murali Vvrsn Gurajapu**  
Email: murali.g@hyperverge.co

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Star History

If you find this useful, please consider starring the repository!

---

**Made with care for better user feedback collection** 💙

For detailed documentation, visit [`./docs`](./docs/README.md)
