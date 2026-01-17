/**
 * Feedback routes
 *
 * Full CRUD operations for feedback items.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, desc, asc, and, like, sql, count } from "drizzle-orm";
import { db, schema } from "../db";
import { nanoid } from "nanoid";

export const feedbackRouter = new Hono();

// Validation schemas
const feedbackTypeEnum = z.enum([
  "bug",
  "feature",
  "improvement",
  "question",
  "other",
]);
const feedbackStatusEnum = z.enum([
  "pending",
  "in_progress",
  "resolved",
  "closed",
  "archived",
]);
const feedbackPriorityEnum = z.enum(["low", "medium", "high", "critical"]);

const createFeedbackSchema = z.object({
  projectId: z.string().min(1),
  sessionId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: feedbackTypeEnum.default("bug"),
  priority: feedbackPriorityEnum.default("medium"),
  userEmail: z.string().email().optional(),
  userName: z.string().optional(),
  environment: z
    .object({
      userAgent: z.string(),
      browser: z.string().optional(),
      browserVersion: z.string().optional(),
      os: z.string().optional(),
      viewportWidth: z.number().optional(),
      viewportHeight: z.number().optional(),
      devicePixelRatio: z.number().optional(),
      url: z.string(),
      pageTitle: z.string().optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  screenshots: z
    .array(
      z.object({
        mimeType: z.string(),
        data: z.string(),
        width: z.number().optional(),
        height: z.number().optional(),
        annotations: z.array(z.any()).optional(),
      })
    )
    .optional(),
  consoleLogs: z
    .array(
      z.object({
        level: z.enum(["log", "info", "warn", "error", "debug"]),
        message: z.string(),
        timestamp: z.string(),
        data: z.array(z.any()).optional(),
      })
    )
    .optional(),
  networkRequests: z
    .array(
      z.object({
        url: z.string(),
        method: z.string(),
        status: z.number().optional(),
        duration: z.number().optional(),
        timestamp: z.string(),
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .optional(),
});

const updateFeedbackSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  type: feedbackTypeEnum.optional(),
  status: feedbackStatusEnum.optional(),
  priority: feedbackPriorityEnum.optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  projectId: z.string().optional(),
  status: feedbackStatusEnum.optional(),
  type: feedbackTypeEnum.optional(),
  priority: feedbackPriorityEnum.optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * List feedback with pagination and filtering
 */
feedbackRouter.get("/", zValidator("query", listQuerySchema), async (c) => {
  const query = c.req.valid("query");

  // Build where conditions
  const conditions = [];

  if (query.projectId) {
    conditions.push(eq(schema.feedback.projectId, query.projectId));
  }
  if (query.status) {
    conditions.push(eq(schema.feedback.status, query.status));
  }
  if (query.type) {
    conditions.push(eq(schema.feedback.type, query.type));
  }
  if (query.priority) {
    conditions.push(eq(schema.feedback.priority, query.priority));
  }
  if (query.search) {
    conditions.push(like(schema.feedback.title, `%${query.search}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.feedback)
    .where(whereClause);

  // Get paginated results
  const offset = (query.page - 1) * query.limit;
  const orderByColumn =
    query.sortBy === "priority"
      ? schema.feedback.priority
      : query.sortBy === "updatedAt"
        ? schema.feedback.updatedAt
        : schema.feedback.createdAt;

  const orderByFn = query.sortOrder === "asc" ? asc : desc;

  const items = await db
    .select()
    .from(schema.feedback)
    .where(whereClause)
    .orderBy(orderByFn(orderByColumn))
    .limit(query.limit)
    .offset(offset);

  return c.json({
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  });
});

/**
 * Get feedback statistics
 */
feedbackRouter.get("/stats", async (c) => {
  const projectId = c.req.query("projectId");

  const whereClause = projectId
    ? eq(schema.feedback.projectId, projectId)
    : undefined;

  // Get counts by status
  const statusCounts = await db
    .select({
      status: schema.feedback.status,
      count: count(),
    })
    .from(schema.feedback)
    .where(whereClause)
    .groupBy(schema.feedback.status);

  // Get counts by type
  const typeCounts = await db
    .select({
      type: schema.feedback.type,
      count: count(),
    })
    .from(schema.feedback)
    .where(whereClause)
    .groupBy(schema.feedback.type);

  // Get counts by priority
  const priorityCounts = await db
    .select({
      priority: schema.feedback.priority,
      count: count(),
    })
    .from(schema.feedback)
    .where(whereClause)
    .groupBy(schema.feedback.priority);

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.feedback)
    .where(whereClause);

  return c.json({
    total,
    byStatus: Object.fromEntries(
      statusCounts.map((s) => [s.status, s.count])
    ),
    byType: Object.fromEntries(typeCounts.map((t) => [t.type, t.count])),
    byPriority: Object.fromEntries(
      priorityCounts.map((p) => [p.priority, p.count])
    ),
  });
});

/**
 * Export feedback (CSV format)
 */
feedbackRouter.get("/export", async (c) => {
  const projectId = c.req.query("projectId");

  const whereClause = projectId
    ? eq(schema.feedback.projectId, projectId)
    : undefined;

  const items = await db
    .select()
    .from(schema.feedback)
    .where(whereClause)
    .orderBy(desc(schema.feedback.createdAt));

  // Build CSV
  const headers = [
    "id",
    "projectId",
    "title",
    "description",
    "type",
    "status",
    "priority",
    "userEmail",
    "userName",
    "createdAt",
  ];
  const csvRows = [headers.join(",")];

  for (const item of items) {
    const row = [
      item.id,
      item.projectId,
      `"${(item.title || "").replace(/"/g, '""')}"`,
      `"${(item.description || "").replace(/"/g, '""')}"`,
      item.type,
      item.status,
      item.priority,
      item.userEmail || "",
      item.userName || "",
      item.createdAt,
    ];
    csvRows.push(row.join(","));
  }

  c.header("Content-Type", "text/csv");
  c.header(
    "Content-Disposition",
    `attachment; filename="feedback-export-${new Date().toISOString().split("T")[0]}.csv"`
  );

  return c.text(csvRows.join("\n"));
});

// Advanced search schema
const advancedSearchSchema = z.object({
  // Text search
  query: z.string().optional(),
  searchFields: z.array(z.enum(["title", "description", "tags", "userEmail", "userName"])).default(["title", "description"]),
  
  // Filters
  projectId: z.string().optional(),
  sessionId: z.string().optional(),
  status: z.union([feedbackStatusEnum, z.array(feedbackStatusEnum)]).optional(),
  type: z.union([feedbackTypeEnum, z.array(feedbackTypeEnum)]).optional(),
  priority: z.union([feedbackPriorityEnum, z.array(feedbackPriorityEnum)]).optional(),
  tags: z.array(z.string()).optional(),
  userEmail: z.string().optional(),
  
  // Date range
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  dateField: z.enum(["createdAt", "updatedAt"]).default("createdAt"),
  
  // Has filters
  hasScreenshots: z.boolean().optional(),
  hasVideo: z.boolean().optional(),
  hasConsoleLogs: z.boolean().optional(),
  hasNetworkRequests: z.boolean().optional(),
  
  // Pagination and sorting
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "updatedAt", "priority", "title", "type", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Advanced search endpoint
 * 
 * Supports:
 * - Full-text search across multiple fields
 * - Multi-value filters (e.g., multiple statuses)
 * - Date range filtering
 * - Has* filters (hasScreenshots, hasVideo, etc.)
 * - Tag filtering
 */
feedbackRouter.post("/search", zValidator("json", advancedSearchSchema), async (c) => {
  const search = c.req.valid("json");
  
  // Build where conditions
  const conditions: ReturnType<typeof eq>[] = [];
  
  // Project and session filters
  if (search.projectId) {
    conditions.push(eq(schema.feedback.projectId, search.projectId));
  }
  if (search.sessionId) {
    conditions.push(eq(schema.feedback.sessionId, search.sessionId));
  }
  
  // Status filter (single or multiple)
  if (search.status) {
    const statuses = Array.isArray(search.status) ? search.status : [search.status];
    if (statuses.length === 1) {
      conditions.push(eq(schema.feedback.status, statuses[0]));
    } else if (statuses.length > 1) {
      conditions.push(sql`${schema.feedback.status} IN (${sql.join(statuses.map(s => sql`${s}`), sql`, `)})`);
    }
  }
  
  // Type filter (single or multiple)
  if (search.type) {
    const types = Array.isArray(search.type) ? search.type : [search.type];
    if (types.length === 1) {
      conditions.push(eq(schema.feedback.type, types[0]));
    } else if (types.length > 1) {
      conditions.push(sql`${schema.feedback.type} IN (${sql.join(types.map(t => sql`${t}`), sql`, `)})`);
    }
  }
  
  // Priority filter (single or multiple)
  if (search.priority) {
    const priorities = Array.isArray(search.priority) ? search.priority : [search.priority];
    if (priorities.length === 1) {
      conditions.push(eq(schema.feedback.priority, priorities[0]));
    } else if (priorities.length > 1) {
      conditions.push(sql`${schema.feedback.priority} IN (${sql.join(priorities.map(p => sql`${p}`), sql`, `)})`);
    }
  }
  
  // User email filter
  if (search.userEmail) {
    conditions.push(like(schema.feedback.userEmail, `%${search.userEmail}%`));
  }
  
  // Date range filter
  if (search.startDate) {
    const dateColumn = search.dateField === "updatedAt" ? schema.feedback.updatedAt : schema.feedback.createdAt;
    conditions.push(sql`${dateColumn} >= ${search.startDate}`);
  }
  if (search.endDate) {
    const dateColumn = search.dateField === "updatedAt" ? schema.feedback.updatedAt : schema.feedback.createdAt;
    conditions.push(sql`${dateColumn} <= ${search.endDate}`);
  }
  
  // Text search across multiple fields
  if (search.query && search.query.trim()) {
    const searchTerm = `%${search.query.trim()}%`;
    const searchConditions: ReturnType<typeof sql>[] = [];
    
    for (const field of search.searchFields) {
      switch (field) {
        case "title":
          searchConditions.push(sql`${schema.feedback.title} LIKE ${searchTerm}`);
          break;
        case "description":
          searchConditions.push(sql`${schema.feedback.description} LIKE ${searchTerm}`);
          break;
        case "tags":
          searchConditions.push(sql`${schema.feedback.tags} LIKE ${searchTerm}`);
          break;
        case "userEmail":
          searchConditions.push(sql`${schema.feedback.userEmail} LIKE ${searchTerm}`);
          break;
        case "userName":
          searchConditions.push(sql`${schema.feedback.userName} LIKE ${searchTerm}`);
          break;
      }
    }
    
    if (searchConditions.length > 0) {
      conditions.push(sql`(${sql.join(searchConditions, sql` OR `)})`);
    }
  }
  
  // Tag filter (all tags must match)
  if (search.tags && search.tags.length > 0) {
    for (const tag of search.tags) {
      conditions.push(sql`${schema.feedback.tags} LIKE ${`%"${tag}"%`}`);
    }
  }
  
  // Build final where clause
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.feedback)
    .where(whereClause);
  
  // Sorting
  const orderByColumn = (() => {
    switch (search.sortBy) {
      case "updatedAt": return schema.feedback.updatedAt;
      case "priority": return schema.feedback.priority;
      case "title": return schema.feedback.title;
      case "type": return schema.feedback.type;
      case "status": return schema.feedback.status;
      default: return schema.feedback.createdAt;
    }
  })();
  
  const orderByFn = search.sortOrder === "asc" ? asc : desc;
  
  // Get paginated results
  const offset = (search.page - 1) * search.pageSize;
  
  let items = await db
    .select()
    .from(schema.feedback)
    .where(whereClause)
    .orderBy(orderByFn(orderByColumn))
    .limit(search.pageSize)
    .offset(offset);
  
  // Apply "has" filters (requires checking related tables)
  if (search.hasScreenshots !== undefined || search.hasVideo !== undefined || 
      search.hasConsoleLogs !== undefined || search.hasNetworkRequests !== undefined) {
    const itemIds = items.map(i => i.id);
    
    if (itemIds.length > 0) {
      // Get related data counts for filtering
      const [screenshotCounts, videoIds, consoleLogCounts, networkRequestCounts] = await Promise.all([
        search.hasScreenshots !== undefined 
          ? db.select({ feedbackId: schema.screenshots.feedbackId, count: count() })
              .from(schema.screenshots)
              .where(sql`${schema.screenshots.feedbackId} IN (${sql.join(itemIds.map(id => sql`${id}`), sql`, `)})`)
              .groupBy(schema.screenshots.feedbackId)
          : Promise.resolve([]),
        search.hasVideo !== undefined
          ? db.select({ feedbackId: schema.videos.feedbackId })
              .from(schema.videos)
              .where(and(
                sql`${schema.videos.feedbackId} IN (${sql.join(itemIds.map(id => sql`${id}`), sql`, `)})`,
                eq(schema.videos.status, "ready")
              ))
          : Promise.resolve([]),
        search.hasConsoleLogs !== undefined
          ? db.select({ feedbackId: schema.consoleLogs.feedbackId, count: count() })
              .from(schema.consoleLogs)
              .where(sql`${schema.consoleLogs.feedbackId} IN (${sql.join(itemIds.map(id => sql`${id}`), sql`, `)})`)
              .groupBy(schema.consoleLogs.feedbackId)
          : Promise.resolve([]),
        search.hasNetworkRequests !== undefined
          ? db.select({ feedbackId: schema.networkRequests.feedbackId, count: count() })
              .from(schema.networkRequests)
              .where(sql`${schema.networkRequests.feedbackId} IN (${sql.join(itemIds.map(id => sql`${id}`), sql`, `)})`)
              .groupBy(schema.networkRequests.feedbackId)
          : Promise.resolve([]),
      ]);
      
      const screenshotMap = new Set(screenshotCounts.map(s => s.feedbackId));
      const videoMap = new Set(videoIds.map(v => v.feedbackId));
      const consoleLogMap = new Set(consoleLogCounts.map(c => c.feedbackId));
      const networkRequestMap = new Set(networkRequestCounts.map(n => n.feedbackId));
      
      items = items.filter(item => {
        if (search.hasScreenshots !== undefined) {
          const has = screenshotMap.has(item.id);
          if (search.hasScreenshots !== has) return false;
        }
        if (search.hasVideo !== undefined) {
          const has = videoMap.has(item.id);
          if (search.hasVideo !== has) return false;
        }
        if (search.hasConsoleLogs !== undefined) {
          const has = consoleLogMap.has(item.id);
          if (search.hasConsoleLogs !== has) return false;
        }
        if (search.hasNetworkRequests !== undefined) {
          const has = networkRequestMap.has(item.id);
          if (search.hasNetworkRequests !== has) return false;
        }
        return true;
      });
    }
  }
  
  return c.json({
    items,
    pagination: {
      page: search.page,
      pageSize: search.pageSize,
      total,
      totalPages: Math.ceil(total / search.pageSize),
      hasMore: search.page * search.pageSize < total,
    },
    filters: {
      query: search.query,
      searchFields: search.searchFields,
      projectId: search.projectId,
      sessionId: search.sessionId,
      status: search.status,
      type: search.type,
      priority: search.priority,
      tags: search.tags,
      startDate: search.startDate,
      endDate: search.endDate,
      dateField: search.dateField,
    },
  });
});

/**
 * Get single feedback by ID
 */
feedbackRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const [item] = await db
    .select()
    .from(schema.feedback)
    .where(eq(schema.feedback.id, id));

  if (!item) {
    return c.json({ error: "Feedback not found" }, 404);
  }

  // Get related data
  const [screenshots, consoleLogs, networkRequests] = await Promise.all([
    db
      .select()
      .from(schema.screenshots)
      .where(eq(schema.screenshots.feedbackId, id)),
    db
      .select()
      .from(schema.consoleLogs)
      .where(eq(schema.consoleLogs.feedbackId, id)),
    db
      .select()
      .from(schema.networkRequests)
      .where(eq(schema.networkRequests.feedbackId, id)),
  ]);

  return c.json({
    ...item,
    screenshots,
    consoleLogs,
    networkRequests,
  });
});

/**
 * Create new feedback
 */
feedbackRouter.post(
  "/",
  zValidator("json", createFeedbackSchema),
  async (c) => {
    const data = c.req.valid("json");
    const now = new Date().toISOString();
    const feedbackId = nanoid();

    // Insert feedback
    await db.insert(schema.feedback).values({
      id: feedbackId,
      projectId: data.projectId,
      sessionId: data.sessionId,
      title: data.title,
      description: data.description ?? null,
      type: data.type,
      status: "pending",
      priority: data.priority,
      userEmail: data.userEmail ?? null,
      userName: data.userName ?? null,
      environment: data.environment as schema.Feedback["environment"],
      tags: data.tags ?? null,
      metadata: data.metadata as schema.Feedback["metadata"],
      createdAt: now,
      updatedAt: now,
    });

    // Insert screenshots
    if (data.screenshots?.length) {
      await db.insert(schema.screenshots).values(
        data.screenshots.map((s) => ({
          id: nanoid(),
          feedbackId,
          mimeType: s.mimeType,
          data: s.data,
          width: s.width,
          height: s.height,
          capturedAt: now,
          annotations: s.annotations,
        }))
      );
    }

    // Insert console logs
    if (data.consoleLogs?.length) {
      await db.insert(schema.consoleLogs).values(
        data.consoleLogs.map((log) => ({
          id: nanoid(),
          feedbackId,
          level: log.level,
          message: log.message,
          timestamp: log.timestamp,
          data: log.data,
        }))
      );
    }

    // Insert network requests
    if (data.networkRequests?.length) {
      await db.insert(schema.networkRequests).values(
        data.networkRequests.map((req) => ({
          id: nanoid(),
          feedbackId,
          url: req.url,
          method: req.method,
          status: req.status,
          duration: req.duration,
          timestamp: req.timestamp,
          success: req.success,
          error: req.error,
        }))
      );
    }

    // Fetch created feedback
    const [created] = await db
      .select()
      .from(schema.feedback)
      .where(eq(schema.feedback.id, feedbackId));

    return c.json(created, 201);
  }
);

/**
 * Update feedback
 */
feedbackRouter.patch(
  "/:id",
  zValidator("json", updateFeedbackSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    // Check if exists
    const [existing] = await db
      .select()
      .from(schema.feedback)
      .where(eq(schema.feedback.id, id));

    if (!existing) {
      return c.json({ error: "Feedback not found" }, 404);
    }

    // Update feedback
    await db
      .update(schema.feedback)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.feedback.id, id));

    // Fetch updated
    const [updated] = await db
      .select()
      .from(schema.feedback)
      .where(eq(schema.feedback.id, id));

    return c.json(updated);
  }
);

/**
 * Delete feedback
 */
feedbackRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");

  // Check if exists
  const [existing] = await db
    .select()
    .from(schema.feedback)
    .where(eq(schema.feedback.id, id));

  if (!existing) {
    return c.json({ error: "Feedback not found" }, 404);
  }

  // Delete (cascade will handle related records)
  await db.delete(schema.feedback).where(eq(schema.feedback.id, id));

  return c.body(null, 204);
});
