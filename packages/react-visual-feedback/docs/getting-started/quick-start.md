# Quick Start

## Basic Usage

The simplest way to add feedback collection to your React app:

```jsx
import React from 'react';
import { FeedbackProvider } from 'react-visual-feedback';

function App() {
  const handleFeedbackSubmit = async (feedbackData) => {
    console.log('Feedback received:', feedbackData);
    
    // Send to your backend
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

## With Dashboard & Screen Recording

Add a full-featured dashboard and screen recording capabilities:

```jsx
import React from 'react';
import { FeedbackProvider, useFeedback } from 'react-visual-feedback';

function FeedbackButtons() {
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

function App() {
  const handleFeedbackSubmit = async (feedbackData) => {
    // feedbackData contains: feedback, screenshot, video, attachment, eventLogs, elementInfo, etc.
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });
  };

  const handleStatusChange = async ({ id, status, comment }) => {
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

## Using Keyboard Shortcuts

The widget provides built-in keyboard shortcuts:

- `Alt+Q` - Activate feedback mode (element selection)
- `Alt+A` - Open manual feedback form
- `Alt+W` - Start screen recording
- `Alt+Shift+Q` - Open dashboard
- `Esc` - Cancel/close

Users can provide feedback without clicking any buttons!

## What's Next?

- Learn about [Next.js setup](./nextjs.md) if you're using Next.js
- Explore [all features](../features/) in detail
- Check out the [API Reference](../api/) for customization options
- Set up [integrations](../integrations/) with Jira or Google Sheets
