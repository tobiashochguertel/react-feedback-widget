# @react-visual-feedback/cli

> Command-line interface for Feedback Server - manage feedback, export reports, and integrate with CI/CD pipelines.

## 📦 Installation

```bash
# npm
npm install -g @react-visual-feedback/cli

# bun
bun add -g @react-visual-feedback/cli

# pnpm
pnpm add -g @react-visual-feedback/cli
```

## 🚀 Quick Start

```bash
# Configure server connection
feedback-cli config set serverUrl http://localhost:3001

# Login to your server
feedback-cli auth login

# List all feedback items
feedback-cli feedback list

# Export feedback to a file
feedback-cli export --format json --output feedback.json
```

## 📋 Commands

### Authentication

```bash
# Login interactively
feedback-cli auth login

# Login with API key
feedback-cli auth login --api-key YOUR_API_KEY

# Check current authentication status
feedback-cli auth whoami

# Logout
feedback-cli auth logout
```

### Feedback Management

```bash
# List all feedback
feedback-cli feedback list

# List with filters
feedback-cli feedback list --status open --type bug --limit 10

# Get details of a specific feedback
feedback-cli feedback get <id>

# Create new feedback
feedback-cli feedback create --title "Bug Report" --type bug --priority high

# Update feedback status
feedback-cli feedback update <id> --status resolved

# Delete feedback
feedback-cli feedback delete <id>

# View statistics
feedback-cli feedback stats
```

### Export

```bash
# Export to JSON
feedback-cli export --format json --output feedback.json

# Export to CSV
feedback-cli export --format csv --output feedback.csv

# Export to Markdown
feedback-cli export --format markdown --output feedback.md

# Export with filters
feedback-cli export --format json --status open --limit 50
```

### Configuration

```bash
# List all config values
feedback-cli config list

# Get a specific config value
feedback-cli config get serverUrl

# Set a config value
feedback-cli config set serverUrl http://localhost:3001

# Reset config to defaults
feedback-cli config reset
```

## 🔧 Global Options

| Option       | Description                 |
| ------------ | --------------------------- |
| `--help`     | Show help information       |
| `--version`  | Show version number         |
| `--debug`    | Enable debug output         |
| `--no-color` | Disable colored output      |
| `--output`   | Output format (table, json) |

## 🌐 Environment Variables

| Variable              | Description                   |
| --------------------- | ----------------------------- |
| `FEEDBACK_SERVER_URL` | Server URL (overrides config) |
| `FEEDBACK_API_KEY`    | API key for authentication    |
| `NO_COLOR`            | Disable colored output        |

## 📖 Examples

### CI/CD Integration

```bash
# In your CI pipeline
export FEEDBACK_SERVER_URL=https://feedback.example.com
export FEEDBACK_API_KEY=${{ secrets.FEEDBACK_API_KEY }}

# Export feedback report
feedback-cli export --format json --output feedback-report.json

# Check for unresolved critical bugs
feedback-cli feedback list --status open --priority critical --output json | jq length
```

### Daily Report Script

```bash
#!/bin/bash
# Generate daily feedback summary

DATE=$(date +%Y-%m-%d)

# Export to markdown for team review
feedback-cli export \
  --format markdown \
  --output "reports/feedback-${DATE}.md" \
  --from "$(date -d 'yesterday' +%Y-%m-%d)"

echo "Report generated: reports/feedback-${DATE}.md"
```

## � Docker

Build CLI binaries for multiple platforms using Docker.

### Build Binaries

```bash
# Using Taskfile (recommended)
task docker:build

# Or directly with Docker
docker build -t feedback-server-cli:latest .
```

### Extract Binaries

```bash
# Build and extract all platform binaries
docker build -t feedback-server-cli:latest .
docker create --name tmp-cli feedback-server-cli:latest
docker cp tmp-cli:/app/dist/bin ./bin
docker rm tmp-cli
```

### Available Binaries

The Docker build produces binaries for:

| Platform    | Binary                             |
| ----------- | ---------------------------------- |
| Linux x64   | `bin/feedback-cli-linux-x64`       |
| Linux ARM64 | `bin/feedback-cli-linux-arm64`     |
| macOS x64   | `bin/feedback-cli-darwin-x64`      |
| macOS ARM64 | `bin/feedback-cli-darwin-arm64`    |
| Windows x64 | `bin/feedback-cli-windows-x64.exe` |

### Docker Compose

```bash
# Build binaries via compose
docker compose up

# Copy binaries from container
docker compose cp cli:/app/dist/bin ./bin
```

> **📖 Full Deployment Guide:** See [docs/deployment/README.md](../../docs/deployment/README.md) for complete Docker deployment documentation.

## �🔗 Related

- [react-visual-feedback](../react-visual-feedback) - React component for collecting visual feedback
- [Feedback Server](../feedback-server) - Backend server for storing and managing feedback

## 📄 License

MIT © React Visual Feedback Contributors
