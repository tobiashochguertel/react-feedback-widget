# @react-visual-feedback/server

> Backend API server for visual feedback - stores feedback submissions, screenshots, recordings, and provides REST API access.

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build
```

## ✨ Features

- 📝 **Feedback CRUD** - Create, read, update, delete feedback items
- 📸 **Screenshot Storage** - Store and serve screenshot images
- 🎥 **Video Storage** - Handle screen recording uploads
- 🔍 **Search & Filter** - Full-text search and filtering
- 📤 **Export** - Export feedback in JSON, CSV, Markdown formats
- 📥 **Import** - Bulk import feedback data
- 🔐 **Authentication** - API key and JWT authentication
- 🔄 **WebSocket** - Real-time updates for connected clients
- 📊 **Statistics** - Aggregate feedback statistics

## 📦 Tech Stack

- **Runtime:** Bun 1.3.6
- **HTTP Framework:** Hono 4.11
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **ORM:** Drizzle 0.45
- **API Spec:** TypeSpec 1.8
- **Validation:** Zod 4.3
- **Testing:** Vitest 4.0

## 🔧 Configuration

### Environment Variables

| Variable            | Description               | Default                |
| ------------------- | ------------------------- | ---------------------- |
| `NODE_ENV`          | Environment mode          | `development`          |
| `PORT`              | Server port               | `3001`                 |
| `DATABASE_URL`      | PostgreSQL connection URL | `postgresql://...`     |
| `DATABASE_PROVIDER` | Database type             | `sqlite` or `postgres` |
| `AUTH_ENABLED`      | Enable authentication     | `true`                 |
| `API_KEY`           | API key for auth          | Required in production |
| `JWT_SECRET`        | JWT signing secret        | Required for JWT auth  |
| `BLOB_STORAGE_PATH` | Path for file storage     | `./uploads`            |
| `MAX_FILE_SIZE`     | Maximum upload size       | `50MB`                 |

### Development

```bash
# Start dev server with hot reload
bun run dev

# Run tests
bun run test

# Run with coverage
bun run test:coverage

# Generate TypeSpec types
bun run generate:types
```

## 📡 API Endpoints

### Health Check

```bash
GET /health
# Returns: { "status": "healthy", "timestamp": "2025-01-20T..." }
```

### Feedback

```bash
# List feedback
GET /api/feedback?status=open&type=bug&limit=10

# Get single feedback
GET /api/feedback/:id

# Create feedback
POST /api/feedback
Content-Type: application/json
{ "title": "Bug Report", "type": "bug", "priority": "high", ... }

# Update feedback
PATCH /api/feedback/:id
Content-Type: application/json
{ "status": "resolved" }

# Delete feedback
DELETE /api/feedback/:id
```

### Export/Import

```bash
# Export feedback
GET /api/feedback/export?format=json

# Import feedback
POST /api/feedback/import
Content-Type: application/json
{ "items": [...] }
```

### Statistics

```bash
GET /api/feedback/stats
# Returns: { "total": 150, "byStatus": {...}, "byType": {...} }
```

## 🐳 Docker

Run the feedback server in a Docker container.

### Quick Start

```bash
# Using Taskfile (recommended)
task docker:build
task docker:run

# Or directly with Docker Compose
docker compose up -d
```

### Build Commands

```bash
# Build the Docker image
docker build -t feedback-server:latest .

# Run standalone with SQLite
docker run -d -p 3001:3001 \
  -v feedback-data:/app/data \
  -v feedback-uploads:/app/uploads \
  feedback-server:latest

# Run with PostgreSQL
docker run -d -p 3001:3001 \
  -e DATABASE_PROVIDER=postgres \
  -e DATABASE_URL=postgresql://user:pass@host:5432/feedback \
  -v feedback-uploads:/app/uploads \
  feedback-server:latest
```

### Environment Variables

| Variable            | Description           | Default                |
| ------------------- | --------------------- | ---------------------- |
| `NODE_ENV`          | Environment           | `production`           |
| `PORT`              | Server port           | `3001`                 |
| `DATABASE_PROVIDER` | Database type         | `sqlite`               |
| `DATABASE_URL`      | PostgreSQL URL        | -                      |
| `AUTH_ENABLED`      | Enable authentication | `true`                 |
| `API_KEY`           | API key               | Required in production |
| `RUN_MIGRATIONS`    | Run DB migrations     | `true`                 |

### Docker Compose

```bash
# Start with PostgreSQL
docker compose up -d

# View logs
docker compose logs -f

# Stop and remove
docker compose down

# Remove volumes too
docker compose down -v
```

### Full Stack Deployment

To run the complete stack with WebUI and example app:

```bash
# From repository root
docker compose up -d

# Access:
# - API: http://localhost:3001
# - WebUI: http://localhost:5173
# - Example App: http://localhost:3002
```

> **📖 Full Deployment Guide:** See [docs/deployment/README.md](../../docs/deployment/README.md) for complete Docker deployment documentation.

## 📁 Project Structure

```
src/
├── routes/             # API route handlers
│   ├── feedback.ts     # Feedback CRUD
│   ├── health.ts       # Health check
│   ├── export.ts       # Export endpoints
│   └── import.ts       # Import endpoints
├── services/           # Business logic
│   ├── feedback.ts     # Feedback service
│   └── storage.ts      # Blob storage
├── db/                 # Database layer
│   ├── schema.ts       # Drizzle schema
│   └── client.ts       # Database client
├── middleware/         # Hono middleware
│   ├── auth.ts         # Authentication
│   └── error.ts        # Error handling
├── types/              # TypeScript types
│   └── generated/      # TypeSpec generated
└── index.ts            # Server entry point

typespec/               # API specification
├── main.tsp            # Main TypeSpec file
└── models/             # Model definitions
```

## 🧪 Testing

```bash
# Run unit tests
bun run test

# Run with coverage
bun run test:coverage

# Run integration tests
bun run test:integration

# Run all tests
bun run test:all
```

## 🔗 Related

- [react-visual-feedback](../react-visual-feedback) - React widget for collecting feedback
- [feedback-server-webui](../feedback-server-webui) - Admin dashboard
- [feedback-server-cli](../feedback-server-cli) - Command-line interface
- [feedback-server-api](../feedback-server-api) - TypeSpec API specification

## 📄 License

MIT © React Visual Feedback Contributors
