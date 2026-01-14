# React Visual Feedback - Monorepo

This is a bun workspace-based monorepo for the React Visual Feedback widget.

## Structure

```
react-feedback-widget-workspace/
├── packages/
│   ├── react-visual-feedback/    # Main library
│   └── feedback-example/          # Next.js example app
├── package.json                   # Workspace root
├── Taskfile.yml                   # Task automation
└── bun.lock                       # Workspace lockfile
```

## Quick Start

```bash
# Install all dependencies
task install
# or: bun install

# Build the library
task build

# Start development server (builds library + runs example on :3002)
task dev

# Build everything
task check
```

## Benefits of Workspace Setup

- ✅ No `file:..` dependency issues
- ✅ Proper workspace protocol `workspace:*`
- ✅ Shared dependencies (deduplication)
- ✅ Clean symlinks between packages
- ✅ Better IDE support
- ✅ Standard monorepo structure

## Available Tasks

Run `task` to see all available commands.

## Migration from Old Structure

This workspace was migrated from a single-repo structure with nested example.
The old `file:..` dependency required `--force` flag due to bun cache issues.
With workspaces, this is no longer needed!
