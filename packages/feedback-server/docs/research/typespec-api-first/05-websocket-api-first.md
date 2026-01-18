# WebSocket API-First with TypeSpec

Research on extending the API-First approach to cover WebSocket/real-time communication protocols using TypeSpec emitters and related technologies.

## 📋 Overview

This document evaluates options for defining WebSocket message contracts using TypeSpec as the single source of truth, complementing the existing REST API-First approach.

## 🎯 Goal

Establish a **type-safe WebSocket contract** using TypeSpec that:

1. Defines all message types (events, commands, responses)
2. Generates validation schemas for runtime message validation
3. Provides TypeScript types for both client and server
4. Documents the WebSocket API contract

## 🔍 Research Summary

### Options Evaluated

| Option | Technology | Viability | Recommendation |
|--------|------------|-----------|----------------|
| A | `@typespec/protobuf` + gRPC streaming | ⚠️ Possible | Overkill for our use case |
| B | `@typespec/json-schema` for messages | ✅ Viable | Part of recommended approach |
| C | Community `@lars-artmann/typespec-asyncapi` | ❌ Not Ready | Alpha quality (38.4% tests) |
| D | **`@typespec/events` + JSON Schema** | ✅ **Recommended** | Official, stable, production-ready |

## 📦 Technology Deep-Dive

### Option A: Protobuf + gRPC Streaming

**Package:** `@typespec/protobuf`

The TypeSpec Protobuf emitter generates Protocol Buffers (proto3) from TypeSpec definitions and supports gRPC streaming modes:

```typespec
import "@typespec/protobuf";

using TypeSpec.Protobuf;

@Protobuf.package({
  name: "feedback.realtime",
})
namespace Feedback.Realtime;

@Protobuf.service
interface FeedbackRealtimeService {
  // Bidirectional streaming
  @Protobuf.stream(StreamMode.Duplex)
  subscribeToUpdates(...FeedbackSubscription): FeedbackEvent;
  
  // Server streaming only
  @Protobuf.stream(StreamMode.Out)
  getFeedbackStream(...FilterCriteria): FeedbackItem;
}
```

**Streaming Modes:**
- `StreamMode.None` - Neither request nor response streamed
- `StreamMode.In` - Request streamed, response synchronous
- `StreamMode.Out` - Request synchronous, response streamed
- `StreamMode.Duplex` - Both request and response streamed (bidirectional)

**Verdict:** ⚠️ **Overkill for our use case**
- Requires gRPC infrastructure
- Binary protocol adds complexity
- Best suited for high-performance microservices, not browser WebSocket

---

### Option B: JSON Schema for Message Validation

**Package:** `@typespec/json-schema`

Generates JSON Schema from TypeSpec models for runtime validation:

```typespec
import "@typespec/json-schema";

using TypeSpec.JsonSchema;

@jsonSchema("/schemas/feedback-websocket")
namespace Feedback.WebSocket.Messages;

model FeedbackCreatedEvent {
  type: "feedback.created";
  timestamp: utcDateTime;
  data: FeedbackItem;
}

model FeedbackUpdatedEvent {
  type: "feedback.updated";
  timestamp: utcDateTime;
  data: FeedbackItem;
  changes: string[];
}

model FeedbackDeletedEvent {
  type: "feedback.deleted";
  timestamp: utcDateTime;
  id: string;
}
```

**Emitter Configuration:**

```yaml
# tspconfig.yaml
emit:
  - "@typespec/json-schema"
options:
  "@typespec/json-schema":
    emitAllModels: true
    emitAllRefs: true
    bundleId: "feedback-websocket-schema"
    file-type: "json"
```

**Verdict:** ✅ **Viable** - Excellent for validation, but doesn't define WebSocket protocol semantics

---

### Option C: Community AsyncAPI Emitter

**Package:** `@lars-artmann/typespec-asyncapi`

A community package attempting to generate AsyncAPI 3.0 from TypeSpec.

**Usage Example:**

```typespec
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

@channel("feedback/events")
@publish
op publishFeedbackEvent(
  @header eventType: string,
  body: FeedbackEvent
): void;

@channel("feedback/commands")
@subscribe
op subscribeToCommands(): FeedbackCommand;
```

**Current Status (as of research date):**

| Metric | Value |
|--------|-------|
| Version | 0.0.1 (Alpha) |
| Test Pass Rate | 255/664 (38.4%) |
| Build Errors | 0 TypeScript errors |
| Stability | 🔴 Not production ready |

**Known Issues:**
- `program.stateMap` undefined errors causing state management failures
- Complex protocols (Kafka, MQTT, WebSocket) implementations disabled
- 5,745 lines of complex infrastructure disabled
- Core decorators (`@channel`, `@publish`, `@subscribe`) work for basic cases

**Verdict:** ❌ **Not Ready**
- Alpha quality with significant limitations
- Wait for 1.0 release before using in production
- Suitable only for experimentation

---

### Option D: TypeSpec Events + JSON Schema (Recommended)

**Package:** `@typespec/events` (Official TypeSpec package)

The official TypeSpec Events package provides decorators for defining event-driven patterns:

**Decorators:**

| Decorator | Target | Purpose |
|-----------|--------|---------|
| `@events` | `Union` | Declares a union type as an event set |
| `@data` | `ModelProperty` | Marks a property as the event payload |
| `@contentType` | `Union`, `UnionVariant`, `ModelProperty` | Specifies content type for envelope |

**Example:**

```typespec
import "@typespec/events";

using TypeSpec.Events;

// Define event types
@events
union FeedbackEvents {
  @contentType("application/json")
  created: FeedbackCreatedEvent,
  
  @contentType("application/json")
  updated: FeedbackUpdatedEvent,
  
  @contentType("application/json")
  deleted: FeedbackDeletedEvent,
  
  // Simple event (string payload)
  connectionEstablished: "connected",
}

// Event payloads
model FeedbackCreatedEvent {
  type: "feedback.created";
  timestamp: utcDateTime;
  @data
  feedback: FeedbackItem;
}

model FeedbackUpdatedEvent {
  type: "feedback.updated";
  timestamp: utcDateTime;
  @data
  feedback: FeedbackItem;
  changes: string[];
}

model FeedbackDeletedEvent {
  type: "feedback.deleted";
  timestamp: utcDateTime;
  id: string;
}
```

**Combined with JSON Schema:**

```typespec
import "@typespec/events";
import "@typespec/json-schema";

using TypeSpec.Events;
using TypeSpec.JsonSchema;

@jsonSchema("/schemas/feedback-events")
@events
union FeedbackEvents {
  created: FeedbackCreatedEvent,
  updated: FeedbackUpdatedEvent,
  deleted: FeedbackDeletedEvent,
}
```

**Verdict:** ✅ **Recommended Approach**
- Official TypeSpec package (stable)
- Clean event modeling semantics
- Combines well with JSON Schema for validation
- Future-proof (will be foundation for AsyncAPI when stable)

---

## 🎓 Recommended Implementation

### Architecture

```mermaid
graph TB
    subgraph TypeSpec Definition
        TS[main.tsp] --> Events[@typespec/events<br/>Event Definitions]
        TS --> JsonSchema[@typespec/json-schema<br/>Schema Generation]
    end
    
    subgraph Generated Artifacts
        Events --> Types[TypeScript Types]
        JsonSchema --> Schemas[JSON Schemas]
    end
    
    subgraph Runtime
        Types --> Server[Hono WebSocket Server]
        Types --> Client[React WebSocket Client]
        Schemas --> Validator[Runtime Validation<br/>Ajv / Zod]
    end
```

### TypeSpec Configuration

```yaml
# packages/feedback-server-api/tspconfig.yaml
emit:
  - "@typespec/openapi3"
  - "@typespec/json-schema"
options:
  "@typespec/openapi3":
    output-file: openapi.yaml
  "@typespec/json-schema":
    emitAllModels: true
    file-type: "json"
    bundleId: "feedback-websocket-events"
```

### Project Structure

```
packages/feedback-server-api/
├── typespec/
│   ├── main.tsp              # Main entry point
│   ├── http/                  # REST API definitions
│   │   └── feedback.tsp
│   └── websocket/             # WebSocket definitions
│       ├── events.tsp         # Server → Client events
│       └── commands.tsp       # Client → Server commands
└── tspconfig.yaml
```

### Example TypeSpec Definitions

**`typespec/websocket/events.tsp`:**

```typespec
import "@typespec/events";
import "@typespec/json-schema";

using TypeSpec.Events;
using TypeSpec.JsonSchema;

namespace Feedback.WebSocket;

/**
 * Server-to-Client Events
 */
@jsonSchema("/schemas/server-events")
@events
union ServerEvents {
  feedbackCreated: FeedbackCreatedEvent,
  feedbackUpdated: FeedbackUpdatedEvent,
  feedbackDeleted: FeedbackDeletedEvent,
  feedbackBulkUpdate: FeedbackBulkUpdateEvent,
  connectionAck: ConnectionAckEvent,
  error: ErrorEvent,
}

model FeedbackCreatedEvent {
  type: "feedback.created";
  timestamp: utcDateTime;
  @data feedback: FeedbackItem;
}

model FeedbackUpdatedEvent {
  type: "feedback.updated";
  timestamp: utcDateTime;
  @data feedback: FeedbackItem;
  changedFields: string[];
}

model FeedbackDeletedEvent {
  type: "feedback.deleted";
  timestamp: utcDateTime;
  feedbackId: string;
}

model FeedbackBulkUpdateEvent {
  type: "feedback.bulk_update";
  timestamp: utcDateTime;
  @data feedbacks: FeedbackItem[];
}

model ConnectionAckEvent {
  type: "connection.ack";
  timestamp: utcDateTime;
  connectionId: string;
  serverVersion: string;
}

model ErrorEvent {
  type: "error";
  timestamp: utcDateTime;
  code: string;
  message: string;
}
```

**`typespec/websocket/commands.tsp`:**

```typespec
import "@typespec/json-schema";

using TypeSpec.JsonSchema;

namespace Feedback.WebSocket;

/**
 * Client-to-Server Commands
 */
@jsonSchema("/schemas/client-commands")
union ClientCommands {
  subscribe: SubscribeCommand,
  unsubscribe: UnsubscribeCommand,
  ping: PingCommand,
}

model SubscribeCommand {
  type: "subscribe";
  channel: string;
  filters?: FilterCriteria;
}

model UnsubscribeCommand {
  type: "unsubscribe";
  channel: string;
}

model PingCommand {
  type: "ping";
  timestamp: utcDateTime;
}

model FilterCriteria {
  types?: FeedbackType[];
  statuses?: FeedbackStatus[];
  projectId?: string;
}
```

### Runtime Implementation

**Hono WebSocket Server:**

```typescript
import { Hono } from 'hono';
import { upgradeWebSocket } from 'hono/cloudflare-workers';
import Ajv from 'ajv';
import serverEventsSchema from '@feedback/api-schemas/server-events.json';
import clientCommandsSchema from '@feedback/api-schemas/client-commands.json';
import type { ServerEvents, ClientCommands } from '@feedback/api-types';

const ajv = new Ajv();
const validateClientCommand = ajv.compile(clientCommandsSchema);

const app = new Hono();

app.get('/ws', upgradeWebSocket((c) => ({
  onMessage(event, ws) {
    const command = JSON.parse(event.data as string) as ClientCommands;
    
    // Validate against JSON Schema
    if (!validateClientCommand(command)) {
      const errorEvent: ServerEvents = {
        type: 'error',
        timestamp: new Date().toISOString(),
        code: 'INVALID_COMMAND',
        message: ajv.errorsText(validateClientCommand.errors),
      };
      ws.send(JSON.stringify(errorEvent));
      return;
    }
    
    // Handle typed command
    switch (command.type) {
      case 'subscribe':
        handleSubscribe(ws, command);
        break;
      case 'unsubscribe':
        handleUnsubscribe(ws, command);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
    }
  },
})));
```

**React WebSocket Client:**

```typescript
import type { ServerEvents, ClientCommands } from '@feedback/api-types';

export function useFeedbackWebSocket(url: string) {
  const ws = useRef<WebSocket | null>(null);
  
  const subscribe = useCallback((channel: string, filters?: FilterCriteria) => {
    const command: ClientCommands = {
      type: 'subscribe',
      channel,
      filters,
    };
    ws.current?.send(JSON.stringify(command));
  }, []);
  
  useEffect(() => {
    ws.current = new WebSocket(url);
    ws.current.onmessage = (event) => {
      const serverEvent = JSON.parse(event.data) as ServerEvents;
      
      switch (serverEvent.type) {
        case 'feedback.created':
          queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
          break;
        case 'feedback.updated':
          queryClient.setQueryData(['feedback', serverEvent.feedback.id], serverEvent.feedback);
          break;
        case 'feedback.deleted':
          queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
          break;
      }
    };
    
    return () => ws.current?.close();
  }, [url]);
  
  return { subscribe };
}
```

---

## 📊 Comparison Summary

| Criteria | Protobuf/gRPC | JSON Schema Only | AsyncAPI Emitter | Events + JSON Schema |
|----------|---------------|------------------|------------------|----------------------|
| **Stability** | ✅ Stable | ✅ Stable | ❌ Alpha | ✅ Stable |
| **Browser Support** | ⚠️ Requires proxy | ✅ Native | ❌ Broken | ✅ Native |
| **Type Safety** | ✅ Excellent | ✅ Good | ⚠️ Partial | ✅ Excellent |
| **Validation** | ✅ Built-in | ✅ JSON Schema | ⚠️ Partial | ✅ JSON Schema |
| **Protocol Semantics** | ✅ Full | ❌ None | ⚠️ Partial | ✅ Event modeling |
| **Complexity** | 🔴 High | 🟢 Low | 🟡 Medium | 🟢 Low |
| **Learning Curve** | 🔴 Steep | 🟢 Minimal | 🟡 Medium | 🟢 Minimal |

---

## ✅ Conclusion

**Recommended Approach: `@typespec/events` + `@typespec/json-schema`**

This combination provides:

1. ✅ **Stable, official packages** - No alpha dependencies
2. ✅ **Clean event modeling** - Using `@events` decorator for semantic clarity
3. ✅ **Runtime validation** - JSON Schema generation for Ajv/Zod validation
4. ✅ **Type safety** - Generated TypeScript types for client and server
5. ✅ **Future-proof** - Official event modeling approach, compatible with future AsyncAPI when stable

**Implementation Priority:**

1. Define WebSocket events and commands in TypeSpec
2. Generate JSON Schemas for runtime validation
3. Use types from `@feedback/api-types` in client and server
4. Validate messages at runtime using Ajv

---

## 🔗 References

- [TypeSpec Events Package](https://github.com/microsoft/typespec/tree/main/packages/events) - Official docs
- [TypeSpec JSON Schema Emitter](https://typespec.io/docs/emitters/json-schema) - Official docs
- [TypeSpec Protobuf Emitter](https://typespec.io/docs/emitters/protobuf) - Official docs
- [LarsArtmann/typespec-asyncapi](https://github.com/LarsArtmann/typespec-asyncapi) - Community AsyncAPI emitter (alpha)

---

**Research compiled by:** GitHub Copilot  
**For project:** react-feedback-widget  
**Date:** January 2025
