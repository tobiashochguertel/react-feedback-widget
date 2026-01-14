# Keyboard Shortcuts

The React Visual Feedback widget provides convenient keyboard shortcuts for quick access to all features.

## Available Shortcuts

| Shortcut      | Action                 | Description                                              |
|---------------|------------------------|----------------------------------------------------------|
| `Alt+Q`       | Activate feedback mode | Enable element selection mode with hover highlighting    |
| `Alt+A`       | Open Manual Feedback   | Open feedback form directly without selecting an element |
| `Alt+W`       | Start screen recording | Begin recording screen with audio and event logs         |
| `Alt+Shift+Q` | Open dashboard         | Open the feedback dashboard (if enabled)                 |
| `Esc`         | Cancel/close           | Cancel current action or close open modals               |

## Usage Examples

### Quick Bug Report

1. Press `Alt+Q` to activate element selection
2. Hover over the problematic element
3. Click to capture a screenshot
4. Fill out the feedback form
5. Submit

### Manual Feedback

1. Press `Alt+A` to open the feedback form directly
2. Type your feedback
3. Optionally attach files via drag & drop
4. Submit

### Record a Session

1. Press `Alt+W` to start recording
2. Perform actions that demonstrate the issue
3. Click stop recording when done
4. Add description and submit

### View Dashboard

1. Press `Alt+Shift+Q` to open the dashboard (developers only)
2. Review all feedback submissions
3. Update statuses
4. Add comments

## Customization

Currently, keyboard shortcuts are hardcoded and cannot be customized. If you need custom shortcuts, consider using the programmatic API via the `useFeedback` hook.

### Disabling Shortcuts

Keyboard shortcuts are enabled by default. To disable them, you would need to:

1. Use controlled mode via `isActive` prop
2. Provide your own buttons/triggers
3. Not use the keyboard shortcuts in your UI flow

## Accessibility

The keyboard shortcuts follow these accessibility principles:

- **Modifier keys**: All shortcuts use `Alt` to avoid conflicts with browser/OS shortcuts
- **Escape key**: Standard escape key behavior for canceling operations
- **Visual feedback**: Active states are clearly indicated in the UI
- **No conflicts**: Shortcuts are chosen to minimize conflicts with common browser shortcuts

## Browser Support

Keyboard shortcuts work in all modern browsers:

- Chrome/Edge
- Firefox
- Safari
- Opera

Note: Some browsers may intercept certain key combinations for their own features. The chosen shortcuts (`Alt+Q`, `Alt+A`, `Alt+W`) are generally available across all platforms.
