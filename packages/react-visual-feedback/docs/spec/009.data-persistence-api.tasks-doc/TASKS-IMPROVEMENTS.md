# Data Persistence API - Improvement Tasks

**Source Specification**: [008.data-persistence-api/README.md](../008.data-persistence-api/README.md)
**Created**: 2026-01-16
**Updated**: 2026-01-16

---

## I001 - Dashboard Export Button

**Status**: 🔲 TODO
**Priority**: 🟡 Medium
**Dependencies**: T002 (ExportService)

### Description

Add an "Export" button to the FeedbackDashboard component that allows users to export all feedback data as a downloadable JSON file.

### Implementation

**Location**: `src/FeedbackDashboard.tsx`

#### 1. Import Dependencies

```typescript
import {
  createPersistenceServices,
  type ExportOptions,
} from "./services/persistence";
```

#### 2. Add Export Handler

```typescript
const handleExport = useCallback(async () => {
  try {
    const { exportService } = createPersistenceServices();
    await exportService.exportToFile({
      includeVideos: true,
    });
  } catch (error) {
    console.error("Export failed:", error);
    // Optionally show error toast
  }
}, []);
```

#### 3. Add Export Button to UI

```tsx
{
  /* Add to action bar / header */
}
<ActionButton
  onClick={handleExport}
  title="Export all feedback"
  data-testid="export-button"
>
  <DownloadIcon />
  Export
</ActionButton>;
```

#### 4. Styled Components

```typescript
const DownloadIcon = styled.span`
  &::before {
    content: "⬇️";
    margin-right: 4px;
  }
`;
```

### UI/UX Considerations

- Button should be in the header/toolbar area of the dashboard
- Use clear icon (download arrow) with "Export" label
- Show loading state during export (for large datasets)
- Show success toast after export completes
- Handle errors gracefully with error toast

### Acceptance Criteria

- [ ] Export button visible in FeedbackDashboard
- [ ] Clicking button triggers file download
- [ ] Downloaded file contains all feedback items
- [ ] Downloaded file includes all videos (base64)
- [ ] Button has appropriate accessibility attributes
- [ ] Button shows loading state during export
- [ ] Success/error feedback provided to user

### Testing

- [ ] Unit test: handleExport calls exportService
- [ ] E2E test: clicking export triggers download
- [ ] E2E test: exported file contains expected data
- [ ] Accessibility test: button has proper labels

---

## I002 - Dashboard Import Button

**Status**: 🔲 TODO
**Priority**: 🟡 Medium
**Dependencies**: T003 (ImportService)

### Description

Add an "Import" button to the FeedbackDashboard component that allows users to import feedback data from a previously exported JSON file.

### Implementation

**Location**: `src/FeedbackDashboard.tsx`

#### 1. Import Dependencies

```typescript
import {
  createPersistenceServices,
  type ImportOptions,
  type ImportResult,
} from "./services/persistence";
```

#### 2. Add File Input Ref

```typescript
const fileInputRef = useRef<HTMLInputElement>(null);
```

#### 3. Add Import Handlers

```typescript
const handleImportClick = useCallback(() => {
  fileInputRef.current?.click();
}, []);

const handleFileChange = useCallback(
  async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { importService } = createPersistenceServices();
      const result = await importService.importFromFile(file, {
        duplicateHandling: "skip",
        includeVideos: true,
      });

      if (result.success) {
        // Refresh feedback list
        const stored = localStorage.getItem(STORAGE.FEEDBACK_KEY);
        if (stored) {
          setItems(JSON.parse(stored));
        }

        // Show success message
        console.log(
          `Imported ${result.importedCount} items, skipped ${result.skippedCount}`,
        );
      } else {
        console.error("Import failed:", result.errors);
      }
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      // Reset file input
      event.target.value = "";
    }
  },
  [],
);
```

#### 4. Add Import Button to UI

```tsx
{
  /* Add to action bar / header */
}
<ActionButton
  onClick={handleImportClick}
  title="Import feedback from file"
  data-testid="import-button"
>
  <UploadIcon />
  Import
</ActionButton>;

{
  /* Hidden file input */
}
<input
  ref={fileInputRef}
  type="file"
  accept=".json,application/json"
  onChange={handleFileChange}
  style={{ display: "none" }}
  data-testid="import-file-input"
/>;
```

#### 5. Styled Components

```typescript
const UploadIcon = styled.span`
  &::before {
    content: "⬆️";
    margin-right: 4px;
  }
`;
```

### UI/UX Considerations

- Button should be next to Export button in header
- Use clear icon (upload arrow) with "Import" label
- Show file picker dialog on click
- Only accept .json files
- Show loading state during import
- Display import summary (imported count, skipped count)
- Handle errors gracefully with error toast
- Auto-refresh the feedback list after successful import

### Acceptance Criteria

- [ ] Import button visible in FeedbackDashboard
- [ ] Clicking button opens file picker
- [ ] File picker filters for JSON files only
- [ ] Valid JSON file successfully imported
- [ ] Feedback list refreshes after import
- [ ] Import summary shown to user
- [ ] Duplicate items handled per options
- [ ] Invalid files show error message
- [ ] Button has appropriate accessibility attributes

### Testing

- [ ] Unit test: handleImportClick triggers file input
- [ ] Unit test: handleFileChange calls importService
- [ ] Unit test: state updates after successful import
- [ ] E2E test: import workflow with valid file
- [ ] E2E test: import workflow with invalid file
- [ ] E2E test: duplicate handling works correctly
- [ ] Accessibility test: button has proper labels

---

## Implementation Notes

### Shared Components

Both buttons should use consistent styling with existing dashboard buttons. Consider creating a shared `ActionButton` component if not already available.

### Error Handling

Both operations should catch errors and display user-friendly messages. Consider using the existing toast/notification system if available.

### State Management

After import, the dashboard's feedback list state must be refreshed. This may require:

1. Re-reading from localStorage
2. Calling a refresh function if using React context
3. Forcing a re-render

### Loading States

For large exports/imports, consider:

1. Showing a spinner on the button
2. Disabling the button during operation
3. Showing a progress indicator for multi-step operations

---

**Documentation compiled by:** GitHub Copilot
**For project:** react-visual-feedback
**Date:** January 16, 2026
