# Migration Guide: Single Repo → Bun Workspaces

## Overview

Migrated from nested structure (`example-nextjs/` inside main project) to proper bun workspaces monorepo.

## Before (Old Structure)

```
react-feedback-widget/
├── src/
├── example-nextjs/              # Nested example
│   └── package.json             # "react-visual-feedback": "file:.."
├── package.json
└── Taskfile.yml
```

**Issues:**
- ❌ `file:..` dependency caused bun cache corruption
- ❌ Required `--force` flag for installs
- ❌ Example deps couldn't install before library built
- ❌ Complex dependency order in Taskfile

## After (Workspace Structure)

```
react-feedback-widget-workspace/
├── packages/
│   ├── react-visual-feedback/   # Library
│   │   ├── src/
│   │   └── package.json
│   └── feedback-example/         # Example
│       └── package.json          # "react-visual-feedback": "workspace:*"
├── package.json                  # Workspace root
├── Taskfile.yml
└── bun.lock
```

**Benefits:**
- ✅ Proper `workspace:*` protocol
- ✅ No cache issues, no `--force` needed
- ✅ Automatic symlinks between packages
- ✅ Shared dependencies (deduplication)
- ✅ Simple, standard monorepo structure
- ✅ Better IDE support

## Migration Steps

### 1. Create Workspace Structure
```bash
cd ~/work-dev/external-repositories/Murali1889/
mkdir -p react-feedback-widget-workspace/packages
cd react-feedback-widget-workspace
```

### 2. Create Root package.json
```json
{
  "name": "react-feedback-widget-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["packages/*"],
  "packageManager": "bun@1.3.5"
}
```

### 3. Move Projects
```bash
# Copy library (excluding examples and build artifacts)
cp -R ../react-feedback-widget packages/react-visual-feedback
cd packages/react-visual-feedback
rm -rf example example-nextjs node_modules dist .git

# Copy example
cd ../..
cp -R ../react-feedback-widget/example-nextjs packages/feedback-example
rm -rf packages/feedback-example/{node_modules,.next}
```

### 4. Update Example Dependency
```json
// packages/feedback-example/package.json
{
  "dependencies": {
    "react-visual-feedback": "workspace:*"  // Changed from "file:.."
  }
}
```

### 5. Install & Test
```bash
bun install          # Installs all workspace deps
task build           # Build library
task dev             # Start example on :3002
```

## Development Workflow

### Old Way
```bash
# Complex dependency management
task install         # Install main deps
cd example-nextjs && bun install --force  # Force to avoid cache issues
task build           # Build library first
task dev             # Hope it works
```

### New Way
```bash
# Simple, clean
task install         # Or just: bun install
task build          
task dev             # Just works!
```

## Taskfile Changes

### Old Taskfile Issues
- Needed `_ensure-deps` and `_ensure-example-deps` separation
- Required `--force` flag for example installs
- Build order dependencies complex

### New Taskfile
- Simple `dir:` parameter for each task
- No special dependency management needed
- Clean, straightforward commands

## Testing Migration

```bash
cd react-feedback-widget-workspace

# From clean state
task clean
task install
task build
task dev

# Should work without any --force flags or special handling!
```

## Rollback

If needed, the original structure is still in:
`~/work-dev/external-repositories/Murali1889/react-feedback-widget/`

## Conclusion

The workspace structure eliminates all `file:..` issues and provides a standard, maintainable monorepo setup that follows bun best practices.
