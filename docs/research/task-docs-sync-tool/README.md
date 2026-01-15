# Task Documentation Sync Tool - Research & Proposal

> AI Agent thoughts on automating task documentation status updates

**Created:** January 15, 2026
**Author:** GitHub Copilot (Claude Opus 4.5)
**Status:** Proposal

---

## 🎯 Problem Statement

When working on task-based documentation (like `TASKS-OVERVIEW.md`, `TASKS-IMPROVEMENTS.md`, `TASKS-VERIFICATION.md`), status updates need to be synchronized across multiple locations:

1. **Individual Task Status** - Each task has its own status field (🔲 TODO, 🔄 In Progress, ✅ Done)
2. **Summary Tables** - Overview tables showing all tasks and their statuses
3. **Quick Status Overview** - Aggregated counts (Total, Done, In Progress, TODO)
4. **Checkboxes** - Task completion checkboxes within task details
5. **Cross-References** - Related tasks in other documents

### Current Pain Points

1. **Manual Updates Are Error-Prone** - Easy to update one location but forget another
2. **Inconsistency** - Summary table says "In Progress" but task detail says "TODO"
3. **Cognitive Load** - AI agents (and humans) must remember all locations to update
4. **Time Waste** - Searching through documents to find all occurrences
5. **Merge Conflicts** - Multiple updates to same table structures

---

## 💡 Proposed Solution: Task Docs Sync Tool

A CLI tool or MCP server that:

1. **Parses Task Documentation** - Understands the structure of task docs
2. **Maintains Single Source of Truth** - One command updates all locations
3. **Validates Consistency** - Checks for status mismatches
4. **Generates Reports** - Shows progress, inconsistencies

---

## 🔧 Tool Options

### Option A: CLI Tool (Recommended for Simplicity)

```bash
# Update a task status
task-docs update I001 --status done

# Update multiple tasks
task-docs update I001 I002 I003 --status done

# Validate all documents
task-docs validate

# Generate progress report
task-docs report

# Initialize task tracking in a project
task-docs init ./docs/spec/my-tasks/
```

**Pros:**
- Simple to implement
- Works in any terminal
- Easy to integrate into CI/CD
- No server to maintain

**Cons:**
- No real-time updates
- Requires manual invocation

### Option B: MCP Server

```typescript
// AI Agent calls:
mcp_taskdocs_update_status({ taskId: "I001", status: "done" })
mcp_taskdocs_validate({ directory: "./docs/spec/my-tasks/" })
mcp_taskdocs_get_progress({ directory: "./docs/spec/my-tasks/" })
```

**Pros:**
- AI agents can call directly during work
- Real-time validation
- Integrated into AI workflow

**Cons:**
- More complex to implement
- Requires MCP server infrastructure
- Another process to manage

### Option C: Hybrid (CLI + MCP)

Build CLI first, then wrap it as MCP server. Best of both worlds.

---

## 📋 Data Model

### Task Status Enum

```typescript
type TaskStatus = 'todo' | 'in-progress' | 'done' | 'blocked' | 'skipped';

interface TaskStatusDisplay {
  todo: '🔲 TODO';
  'in-progress': '🔄 In Progress';
  done: '✅ Done';
  blocked: '🚫 Blocked';
  skipped: '⏭️ Skipped';
}
```

### Task Definition

```typescript
interface Task {
  id: string;           // "I001", "V002", "F003"
  category: string;     // "Improvement", "Verification", "Feature"
  title: string;        // "Remove Duplicate Type Exports"
  status: TaskStatus;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[]; // ["I001", "I002"]
  checkboxes: Checkbox[];
  file: string;         // Source file path
  line: number;         // Line number in source file
}

interface Checkbox {
  label: string;
  checked: boolean;
  line: number;
}
```

### Document Structure

```typescript
interface TaskDocument {
  path: string;
  type: 'overview' | 'detail' | 'summary';
  tasks: Task[];
  tables: Table[];
  quickStats: QuickStats;
}

interface Table {
  name: string;
  rows: TableRow[];
  startLine: number;
  endLine: number;
}

interface QuickStats {
  total: number;
  done: number;
  inProgress: number;
  todo: number;
}
```

---

## 🛠️ Implementation Architecture

### Parser Module

```
┌─────────────────────────────────────────────────────────┐
│                    Markdown Parser                       │
├─────────────────────────────────────────────────────────┤
│  1. Parse document structure (headings, tables, lists)  │
│  2. Extract task definitions (ID, title, status)        │
│  3. Extract tables with status columns                  │
│  4. Extract checkboxes with task associations           │
│  5. Build document AST                                  │
└─────────────────────────────────────────────────────────┘
```

### Update Engine

```
┌─────────────────────────────────────────────────────────┐
│                    Update Engine                         │
├─────────────────────────────────────────────────────────┤
│  1. Find all occurrences of task ID                     │
│  2. Update status emoji/text at each location           │
│  3. Update table rows                                   │
│  4. Recalculate quick stats                             │
│  5. Update checkboxes if status = done                  │
│  6. Write changes back to files                         │
└─────────────────────────────────────────────────────────┘
```

### Validation Engine

```
┌─────────────────────────────────────────────────────────┐
│                  Validation Engine                       │
├─────────────────────────────────────────────────────────┤
│  1. Check status consistency across all locations       │
│  2. Verify quick stats match actual counts              │
│  3. Ensure all task IDs are unique                      │
│  4. Check dependency ordering                           │
│  5. Report inconsistencies                              │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Document Conventions (Required)

For the tool to work, task documentation must follow these conventions:

### Task ID Format

```markdown
| ID   | Title                         | Status  |
| ---- | ----------------------------- | ------- |
| I001 | Remove Duplicate Type Exports | 🔲 TODO |
```

Pattern: `[A-Z]+[0-9]+` (e.g., I001, V002, F003, DOC001)

### Status Format

```markdown
**Status:** 🔲 TODO
**Status:** 🔄 In Progress
**Status:** ✅ Done
```

### Checkbox Format

```markdown
- [ ] Step 1: Do something
- [x] Step 2: Already done
```

### Quick Stats Table

```markdown
| Category     | Total  | Done  | In Progress | TODO   |
| ------------ | ------ | ----- | ----------- | ------ |
| Improvements | 7      | 0     | 0           | 7      |
```

---

## 🎯 CLI Commands Design

### `task-docs update`

```bash
# Update single task
task-docs update I001 --status done

# Update with message
task-docs update I001 --status done --message "Completed with all tests passing"

# Update multiple
task-docs update I001 I002 --status done

# Start working on task
task-docs update I001 --status in-progress
```

### `task-docs validate`

```bash
# Validate all task docs
task-docs validate

# Validate specific directory
task-docs validate ./docs/spec/remove-technical-debs-tasks-doc/

# Output format
task-docs validate --format json
```

Output:
```
✅ TASKS-OVERVIEW.md - All statuses consistent
❌ TASKS-IMPROVEMENTS.md - Inconsistency found:
   - I001: Summary table says "TODO" but task detail says "Done"
✅ TASKS-VERIFICATION.md - All statuses consistent

Summary: 1 error, 0 warnings
```

### `task-docs report`

```bash
task-docs report

# Output:
# Technical Debt Removal Progress
# ═══════════════════════════════
# 
# ████████░░░░░░░░░░░░  40% (4/10 tasks)
# 
# ✅ Done:        4
# 🔄 In Progress: 1
# 🔲 TODO:        5
# 
# Recent Activity:
# - I001: Done (2 hours ago)
# - I002: Done (1 hour ago)
# - V001: In Progress (now)
```

### `task-docs init`

```bash
task-docs init ./docs/spec/my-new-tasks/

# Creates:
# - TASKS-OVERVIEW.md (template)
# - TASKS-FEATURES.md (template)
# - .taskdocs.yaml (config)
```

---

## 📋 Configuration File

`.taskdocs.yaml`:

```yaml
version: 1
project: react-visual-feedback
docs_root: ./packages/react-visual-feedback/docs/spec/

task_docs:
  - path: remove-technical-debs-tasks-doc/
    overview: TASKS-OVERVIEW.md
    details:
      - TASKS-IMPROVEMENTS.md
      - TASKS-VERIFICATION.md

categories:
  - id: I
    name: Improvement
    prefix: I
  - id: V
    name: Verification
    prefix: V
  - id: F
    name: Feature
    prefix: F

statuses:
  todo:
    emoji: "🔲"
    text: "TODO"
  in-progress:
    emoji: "🔄"
    text: "In Progress"
  done:
    emoji: "✅"
    text: "Done"
  blocked:
    emoji: "🚫"
    text: "Blocked"
```

---

## 🔧 Technology Choices

### Option 1: TypeScript + Bun (Recommended)

```
task-docs/
├── src/
│   ├── cli.ts           # CLI entry point
│   ├── parser.ts        # Markdown parser
│   ├── updater.ts       # Status update engine
│   ├── validator.ts     # Consistency checker
│   ├── reporter.ts      # Progress reports
│   └── types.ts         # TypeScript types
├── package.json
├── tsconfig.json
└── README.md
```

**Why Bun?**
- Fast execution
- Built-in TypeScript support
- Single binary distribution possible
- Native file system APIs

### Option 2: Python + Click

```
task_docs/
├── __init__.py
├── cli.py              # Click CLI
├── parser.py           # Markdown parser
├── updater.py          # Status update engine
├── validator.py        # Consistency checker
└── reporter.py         # Progress reports
```

**Why Python?**
- Excellent markdown parsing libraries (markdown-it, mistune)
- Easy to install via pip
- Familiar to many developers

---

## 🎯 MVP Feature Set

### Phase 1: Core CLI (1-2 days)

1. ✅ Parse markdown task documents
2. ✅ Extract task IDs and statuses
3. ✅ Update single task status
4. ✅ Update summary tables
5. ✅ Update quick stats

### Phase 2: Validation (0.5 days)

1. ✅ Check status consistency
2. ✅ Report mismatches
3. ✅ Suggest fixes

### Phase 3: Reporting (0.5 days)

1. ✅ Progress bar visualization
2. ✅ Task list with statuses
3. ✅ JSON export

### Phase 4: MCP Integration (1 day)

1. ✅ Wrap CLI as MCP server
2. ✅ Expose tools to AI agents
3. ✅ Real-time validation

---

## 💭 My Recommendation

**Start with Option A (CLI Tool) using TypeScript + Bun:**

1. **Immediate Value** - You can use it right away in parallel development
2. **Low Complexity** - No server infrastructure needed
3. **Foundation for MCP** - Easy to wrap as MCP server later
4. **Works with Git Hooks** - Can validate on pre-commit

**Workflow Integration:**

```bash
# Before starting work
task-docs update I001 --status in-progress

# After completing
task-docs update I001 --status done

# Before commit
task-docs validate  # Pre-commit hook
```

**For AI Agent Integration (Later):**

Once CLI is stable, create MCP server wrapper:

```typescript
// mcp-server-taskdocs/src/index.ts
const tools = {
  update_task_status: async (taskId: string, status: TaskStatus) => {
    return execSync(`task-docs update ${taskId} --status ${status}`);
  },
  validate_tasks: async (directory: string) => {
    return execSync(`task-docs validate ${directory} --format json`);
  }
};
```

---

## 🔗 Related Resources

- [unified.js](https://unifiedjs.com/) - Markdown processing ecosystem
- [remark](https://github.com/remarkjs/remark) - Markdown parser for AST manipulation
- [Commander.js](https://github.com/tj/commander.js/) - CLI framework for Node.js
- [Chalk](https://github.com/chalk/chalk) - Terminal styling
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - For MCP server implementation

---

## 📝 Next Steps

If you decide to proceed:

1. **Create New Repository** - `task-docs-sync` or add to existing monorepo
2. **Implement MVP** - Core CLI with update and validate commands
3. **Test with Real Docs** - Use `remove-technical-debs-tasks-doc` as test case
4. **Add MCP Wrapper** - Enable AI agent integration
5. **Document & Publish** - npm package or standalone binary

---

## 🎓 Summary

**The Problem:** Status updates in task documentation require changes in multiple locations, leading to inconsistencies.

**The Solution:** A CLI tool that understands task documentation structure and updates all locations atomically.

**My Recommendation:** Build a TypeScript/Bun CLI first, then wrap as MCP server for AI integration.

**Time Estimate:** 2-3 days for MVP with full functionality.

---

**Your Thoughts?**

Would you like me to:
1. Start implementing this tool in a separate window?
2. Continue with the Technical Debt tasks manually for now?
3. Both - work on tasks while you develop the tool?

---

**Last Updated:** January 15, 2026
