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
