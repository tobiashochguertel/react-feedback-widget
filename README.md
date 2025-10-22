# Murali Feedback Widget React

A powerful, visual feedback collection tool for React applications. Users can select any element on your page, and the widget automatically captures a screenshot and context information.

## Features

- 🎯 Visual element selection with hover highlighting
- 📸 Automatic screenshot capture of selected elements
- 📝 Feedback form with rich context
- ⚡ Lightweight and performant
- 🎨 Customizable styling
- ⌨️ Keyboard shortcuts (Ctrl+Q to activate, Esc to cancel)

## Installation

```bash
npm install murali-feedback-widget-react
```

## Quick Start

### 1. Wrap your app with FeedbackProvider

```jsx
import React from 'react';
import { FeedbackProvider } from 'murali-feedback-widget-react';

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

export default App;
```

### 2. Add a feedback trigger button (optional)

```jsx
import { useFeedback } from 'murali-feedback-widget-react';

function FeedbackButton() {
  const { setIsActive } = useFeedback();

  return (
    <button onClick={() => setIsActive(true)}>
      Report Issue
    </button>
  );
}
```

## Usage

### Keyboard Shortcut
Press **Ctrl+Q** to activate the feedback widget. Press **Esc** to deactivate.

### Programmatic Activation (Uncontrolled Mode)
Use the `useFeedback` hook to control the widget programmatically:

```jsx
import { useFeedback } from 'murali-feedback-widget-react';

function MyComponent() {
  const { isActive, setIsActive } = useFeedback();

  return (
    <button onClick={() => setIsActive(!isActive)}>
      {isActive ? 'Cancel Feedback' : 'Give Feedback'}
    </button>
  );
}
```

### Controlled Mode
You can control the widget's active state from the parent component:

```jsx
import React, { useState } from 'react';
import { FeedbackProvider } from 'murali-feedback-widget-react';

function App() {
  const [isFeedbackActive, setIsFeedbackActive] = useState(false);

  const handleFeedbackSubmit = async (feedbackData) => {
    console.log('Feedback:', feedbackData);
    // Submit to your backend
  };

  return (
    <div>
      <button onClick={() => setIsFeedbackActive(!isFeedbackActive)}>
        {isFeedbackActive ? 'Cancel' : 'Report Bug'}
      </button>

      <FeedbackProvider
        onSubmit={handleFeedbackSubmit}
        isActive={isFeedbackActive}
        onActiveChange={setIsFeedbackActive}
      >
        <YourApp />
      </FeedbackProvider>
    </div>
  );
}
```

## API Reference

### FeedbackProvider

The main provider component that wraps your application.

**Props:**
- `onSubmit` (required): `(feedbackData) => Promise<void>` - Callback function when feedback is submitted
- `children`: React nodes
- `isActive` (optional): `boolean` - Control the widget active state from parent (controlled mode)
- `onActiveChange` (optional): `(active: boolean) => void` - Callback when active state changes (used with controlled mode)

**Feedback Data Structure:**
```javascript
{
  feedback: "User's feedback text",
  elementInfo: {
    tagName: "div",
    id: "element-id",
    className: "element-classes",
    xpath: "//div[@id='element-id']",
    innerText: "Element text content",
    attributes: { /* element attributes */ }
  },
  screenshot: "data:image/png;base64,...", // Base64 encoded screenshot
  url: "https://yourapp.com/current-page",
  userAgent: "Mozilla/5.0...",
  timestamp: "2025-10-22T10:30:00.000Z"
}
```

### useFeedback

Hook to access feedback widget state and controls.

**Returns:**
- `isActive`: boolean - Whether the widget is currently active
- `setIsActive`: (active: boolean) => void - Function to activate/deactivate the widget

## Styling

The widget comes with default styles, but you can customize them by targeting these CSS classes:

```css
.feedback-overlay { /* Background overlay when active */ }
.feedback-highlight { /* Element highlight border */ }
.feedback-tooltip { /* Element info tooltip */ }
.feedback-modal { /* Feedback form modal */ }
.feedback-backdrop { /* Modal backdrop */ }
```

## Example Implementation

```jsx
import React from 'react';
import { FeedbackProvider, useFeedback } from 'murali-feedback-widget-react';

function FeedbackButton() {
  const { isActive, setIsActive } = useFeedback();

  return (
    <button
      onClick={() => setIsActive(true)}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px 20px',
        background: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}
    >
      {isActive ? 'Select Element...' : 'Report Bug'}
    </button>
  );
}

function App() {
  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      const response = await fetch('https://your-api.com/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      });

      if (response.ok) {
        alert('Thank you for your feedback!');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  return (
    <FeedbackProvider onSubmit={handleFeedbackSubmit}>
      <div>
        <h1>My Application</h1>
        <p>Press Ctrl+Q or click the button to report issues</p>
        <FeedbackButton />
      </div>
    </FeedbackProvider>
  );
}

export default App;
```

## How It Works

1. User activates the widget (Ctrl+Q or button click)
2. User hovers over elements to see them highlighted
3. User clicks on the problematic element
4. Widget captures a screenshot of the selected element
5. Feedback form appears with element context pre-filled
6. User enters their feedback and submits
7. Your `onSubmit` handler receives all the data

## Browser Support

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Opera: ✅

Requires `html2canvas` for screenshot functionality.

## Dependencies

- React ^16.8.0 || ^17.0.0 || ^18.0.0
- react-dom ^16.8.0 || ^17.0.0 || ^18.0.0
- html2canvas ^1.4.1
- lucide-react ^0.263.1

## License

MIT © Murali

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Issues

If you encounter any issues, please report them at:
https://github.com/Murali1889/react-feedback-widget/issues

## Author

Murali
