# Feedback Server CLI - Software Specification

> **Version:** 0.1.0
> **Last Updated:** 2025-01-15

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Command Structure](#command-structure)
- [Configuration](#configuration)
- [Output Formats](#output-formats)
- [Error Handling](#error-handling)
- [Security](#security)
- [Distribution](#distribution)

---

## 🎯 Overview

### Purpose

The Feedback Server CLI provides a command-line interface for interacting with the Feedback Server API. It enables developers and administrators to manage feedback, export data, and configure the server from the terminal.

### Key Features

- **CRUD Operations**: Create, read, update, delete feedback items
- **Bulk Operations**: Perform batch operations on multiple items
- **Data Export**: Export feedback in JSON, CSV, or Markdown formats
- **Server Management**: Check server health, view statistics
- **Configuration Management**: Configure API endpoint and credentials
- **Interactive Mode**: Terminal UI for browsing feedback
- **Shell Completion**: Auto-completion for bash, zsh, fish, PowerShell

### Target Users

- **Developers**: Integrating feedback into CI/CD pipelines
- **Administrators**: Managing feedback server from remote machines
- **DevOps Engineers**: Scripting and automation workflows

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Feedback Server CLI                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  Commands   │  │   Config    │  │   Output    │  │   Utils    │ │
│  │   Layer     │  │   Manager   │  │  Formatters │  │            │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬─────┘ │
│         │                │                │                │       │
│  ┌──────┴────────────────┴────────────────┴────────────────┴─────┐ │
│  │                         API Client                            │ │
│  └───────────────────────────────┬───────────────────────────────┘ │
│                                  │                                 │
└──────────────────────────────────┼─────────────────────────────────┘
                                   │ HTTPS
                                   ▼
                        ┌───────────────────┐
                        │  Feedback Server  │
                        │       API         │
                        └───────────────────┘
```

### Module Structure

```
src/
├── index.ts                 # CLI entry point
├── commands/
│   ├── index.ts             # Command registry
│   ├── auth.ts              # login, logout, whoami
│   ├── feedback.ts          # list, get, create, update, delete
│   ├── export.ts            # export, download
│   ├── stats.ts             # stats, dashboard
│   ├── config.ts            # config set, get, init
│   └── completion.ts        # completion scripts
├── lib/
│   ├── api.ts               # API client
│   ├── config.ts            # Config file manager
│   ├── auth.ts              # Authentication helpers
│   └── output.ts            # Output formatters
├── types/
│   └── index.ts             # TypeScript types
└── utils/
    ├── logger.ts            # Logging utilities
    ├── spinner.ts           # Progress spinners
    └── prompt.ts            # Interactive prompts
```

---

## 🛠️ Technology Stack

### Core Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| TypeScript | Type-safe development | 5.x |
| Bun | Runtime and package manager | 1.1.x |
| Commander.js | CLI framework | 12.x |
| Chalk | Terminal styling | 5.x |
| Inquirer | Interactive prompts | 10.x |
| Ora | Progress spinners | 8.x |
| Table | Table formatting | 6.x |

### Additional Libraries

| Library | Purpose |
|---------|---------|
| `conf` | Configuration management |
| `keytar` | Secure credential storage |
| `csv-stringify` | CSV export |
| `yaml` | YAML config support |
| `boxen` | Info boxes |
| `figures` | Terminal symbols |
| `update-notifier` | Version update notifications |

### Build Tools

- **tsup**: Fast TypeScript bundler
- **pkg**: Standalone binary packaging
- **changesets**: Version management

---

## 📟 Command Structure

### Command Hierarchy

```
feedback-cli
├── auth                    # Authentication commands
│   ├── login               # Authenticate with server
│   ├── logout              # Clear credentials
│   └── whoami              # Show current user
│
├── feedback                # Feedback management
│   ├── list                # List feedback items
│   ├── get <id>            # Get feedback details
│   ├── create              # Create new feedback
│   ├── update <id>         # Update feedback
│   ├── delete <id>         # Delete feedback
│   └── bulk                # Bulk operations
│       ├── update          # Bulk update
│       └── delete          # Bulk delete
│
├── export                  # Data export
│   ├── json                # Export as JSON
│   ├── csv                 # Export as CSV
│   └── markdown            # Export as Markdown
│
├── stats                   # Statistics
│   └── summary             # Show summary statistics
│
├── config                  # Configuration
│   ├── init                # Initialize config file
│   ├── get <key>           # Get config value
│   ├── set <key> <value>   # Set config value
│   └── list                # List all config
│
├── completion              # Shell completion
│   ├── bash                # Bash completion script
│   ├── zsh                 # Zsh completion script
│   ├── fish                # Fish completion script
│   └── powershell          # PowerShell completion script
│
└── help                    # Help information
```

### Command Details

#### `feedback-cli auth login`

Authenticate with the Feedback Server.

```bash
feedback-cli auth login [options]

Options:
  -s, --server <url>    Server URL
  -u, --username <user> Username or email
  -p, --password <pass> Password (not recommended, use interactive)
  -k, --api-key <key>   API key authentication
  --no-save             Don't save credentials

Examples:
  $ feedback-cli auth login
  $ feedback-cli auth login --server https://feedback.example.com
  $ feedback-cli auth login --api-key sk_live_xxxxx
```

#### `feedback-cli feedback list`

List feedback items with filtering and pagination.

```bash
feedback-cli feedback list [options]

Options:
  -s, --status <status>   Filter by status (pending, in-progress, resolved, closed)
  -t, --type <type>       Filter by type (bug, feature, improvement, question)
  -p, --priority <level>  Filter by priority (low, medium, high, critical)
  --since <date>          Filter items created after date
  --until <date>          Filter items created before date
  -q, --query <text>      Search query
  -l, --limit <n>         Number of items (default: 20)
  --offset <n>            Pagination offset
  -o, --output <format>   Output format (table, json, yaml)
  --no-color              Disable colored output

Examples:
  $ feedback-cli feedback list
  $ feedback-cli feedback list --status pending --type bug
  $ feedback-cli feedback list --since 2025-01-01 -o json
```

#### `feedback-cli feedback get`

Get detailed information about a feedback item.

```bash
feedback-cli feedback get <id> [options]

Arguments:
  id                    Feedback ID

Options:
  -o, --output <format> Output format (table, json, yaml)
  --include <fields>    Include additional fields (screenshots, video, logs)
  --download-media      Download attached media files

Examples:
  $ feedback-cli feedback get fb_123abc
  $ feedback-cli feedback get fb_123abc -o json
  $ feedback-cli feedback get fb_123abc --download-media
```

#### `feedback-cli feedback create`

Create a new feedback item (for testing or automation).

```bash
feedback-cli feedback create [options]

Options:
  -t, --title <title>         Feedback title (required)
  -d, --description <text>    Description
  --type <type>               Type (bug, feature, improvement, question)
  --priority <level>          Priority (low, medium, high, critical)
  --tags <tags>               Comma-separated tags
  -s, --screenshot <file>     Attach screenshot file
  -f, --from-file <file>      Create from JSON file
  -i, --interactive           Interactive mode

Examples:
  $ feedback-cli feedback create -t "Bug: Login fails" --type bug
  $ feedback-cli feedback create --interactive
  $ feedback-cli feedback create --from-file feedback.json
```

#### `feedback-cli export`

Export feedback data to files.

```bash
feedback-cli export <format> [options]

Arguments:
  format                Output format (json, csv, markdown)

Options:
  -o, --output <file>   Output file path
  -s, --status <status> Filter by status
  -t, --type <type>     Filter by type
  --since <date>        Filter items created after date
  --until <date>        Filter items created before date
  --include-media       Include base64 encoded media

Examples:
  $ feedback-cli export json -o feedback.json
  $ feedback-cli export csv --status pending -o pending.csv
  $ feedback-cli export markdown -o FEEDBACK.md
```

---

## ⚙️ Configuration

### Configuration File

The CLI stores configuration in a YAML file at:

- **Linux/macOS**: `~/.config/feedback-cli/config.yaml`
- **Windows**: `%APPDATA%\feedback-cli\config.yaml`

### Configuration Options

```yaml
# ~/.config/feedback-cli/config.yaml

# Server configuration
server:
  url: https://feedback.example.com
  timeout: 30000  # milliseconds

# Output preferences
output:
  format: table  # table, json, yaml
  color: true
  pager: auto    # auto, always, never

# Pagination defaults
pagination:
  limit: 20

# Authentication (stored securely in keychain)
# Do not store credentials in plain text config

# Shell completion
completion:
  shell: auto  # auto, bash, zsh, fish
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FEEDBACK_SERVER_URL` | Server URL | - |
| `FEEDBACK_API_KEY` | API key for authentication | - |
| `FEEDBACK_CLI_CONFIG` | Custom config file path | `~/.config/feedback-cli/config.yaml` |
| `FEEDBACK_CLI_DEBUG` | Enable debug logging | `false` |
| `NO_COLOR` | Disable colored output | `false` |

---

## 📤 Output Formats

### Table Format (Default)

```
┌──────────────┬────────────────────────────┬────────┬──────────┬────────────┐
│ ID           │ Title                      │ Type   │ Status   │ Created    │
├──────────────┼────────────────────────────┼────────┼──────────┼────────────┤
│ fb_a1b2c3    │ Login button not working   │ bug    │ pending  │ 2025-01-15 │
│ fb_d4e5f6    │ Add dark mode support      │ feature│ progress │ 2025-01-14 │
│ fb_g7h8i9    │ Improve loading speed      │ improve│ resolved │ 2025-01-13 │
└──────────────┴────────────────────────────┴────────┴──────────┴────────────┘
Showing 1-3 of 42 items
```

### JSON Format

```json
{
  "items": [
    {
      "id": "fb_a1b2c3",
      "title": "Login button not working",
      "type": "bug",
      "status": "pending",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### YAML Format

```yaml
items:
  - id: fb_a1b2c3
    title: Login button not working
    type: bug
    status: pending
    createdAt: '2025-01-15T10:30:00Z'
total: 42
page: 1
limit: 20
```

---

## 🚨 Error Handling

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Configuration error |
| 3 | Authentication error |
| 4 | Not found error |
| 5 | Network error |
| 6 | Validation error |

### Error Messages

```bash
# Authentication error
$ feedback-cli feedback list
Error: Not authenticated. Run 'feedback-cli auth login' first.

# Network error
$ feedback-cli feedback list
Error: Cannot connect to server at https://feedback.example.com
  Cause: ECONNREFUSED
  Hint: Check if the server is running and the URL is correct.

# Not found error
$ feedback-cli feedback get fb_nonexistent
Error: Feedback not found: fb_nonexistent
```

---

## 🔐 Security

### Credential Storage

- **macOS**: Keychain Access via `keytar`
- **Linux**: Secret Service API (GNOME Keyring, KWallet)
- **Windows**: Windows Credential Manager

### API Key Handling

- Never log or display full API keys
- Mask keys in output: `sk_live_...xxxx`
- Support environment variable for CI/CD

### Secure Practices

- HTTPS required for all connections
- TLS 1.2+ enforced
- Certificate validation enabled by default
- `--insecure` flag available for development only

---

## 📦 Distribution

### npm Installation

```bash
# Global installation
npm install -g @react-visual-feedback/cli

# or with bun
bun install -g @react-visual-feedback/cli
```

### Standalone Binaries

Pre-built binaries for:

- Linux x64, arm64
- macOS x64, arm64 (Apple Silicon)
- Windows x64

```bash
# Download and install
curl -fsSL https://feedback.example.com/install.sh | sh
```

### Docker Image

```bash
docker run --rm -v ~/.config/feedback-cli:/root/.config/feedback-cli \
  ghcr.io/org/feedback-cli feedback list
```

---

## 📚 Related Documentation

- [Tasks Overview](../002.cli-tasks/TASKS-OVERVIEW.md)
- [User Stories](../003.cli-user-stories/README.md)
- [Feedback Server API](../../feedback-server/docs/spec/001.server-software-specification/README.md)

---

**Document Status:** Draft
**Author:** GitHub Copilot
**Created:** January 2025
