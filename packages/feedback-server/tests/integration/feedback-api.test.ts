/**
 * Integration Tests: Feedback API
 *
 * Tests the feedback API endpoints with actual HTTP requests
 * to verify the complete request/response cycle.
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  createTestClient,
  createTestFeedback,
  waitForServer,
  uniqueId,
  TestClient,
  DEFAULT_BASE_URL,
} from "../setup";

describe("Feedback API Integration", () => {
  let client: TestClient;
  const baseUrl = DEFAULT_BASE_URL;

  beforeAll(async () => {
    await waitForServer(baseUrl, 15000);
    client = createTestClient(baseUrl);
  });

  describe("POST /api/v1/feedback", () => {
    it("should create feedback and return the created item", async () => {
      // Arrange
      const projectId = uniqueId("int-test-project");
      const feedbackData = createTestFeedback({
        projectId,
        title: "Integration Test Feedback",
        description: "Testing the complete create flow",
      });

      // Act
      const response = await client.post<{
        id: string;
        projectId: string;
        title: string;
        description: string;
        createdAt: string;
      }>("/api/v1/feedback", feedbackData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.data?.id).toBeDefined();
      expect(response.data?.projectId).toBe(projectId);
      expect(response.data?.title).toBe("Integration Test Feedback");
      expect(response.data?.description).toBe(
        "Testing the complete create flow"
      );
      expect(response.data?.createdAt).toBeDefined();
    });

    it("should validate required fields", async () => {
      // Arrange - missing required fields
      const invalidData = {
        title: "Only title",
        // missing: type, description, projectId
      };

      // Act
      const response = await client.post("/api/v1/feedback", invalidData);

      // Assert
      expect(response.status).toBe(400);
    });

    it("should accept all optional fields", async () => {
      // Arrange
      const projectId = uniqueId("int-test-optional");
      const feedbackData = createTestFeedback({
        projectId,
        title: "Full Feedback",
        description: "With all fields",
        tags: ["integration", "test", "full"],
        priority: "high",
        metadata: { source: "integration-test" },
      });

      // Act
      const response = await client.post<{
        id: string;
        tags: string[];
        priority: string;
        metadata: object;
      }>("/api/v1/feedback", feedbackData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.data?.tags).toContain("integration");
      expect(response.data?.priority).toBe("high");
      expect(response.data?.metadata).toHaveProperty("source");
    });
  });

  describe("GET /api/v1/feedback", () => {
    it("should list feedback with pagination", async () => {
      // Arrange - create some feedback first
      const projectId = uniqueId("int-test-list");
      for (let i = 0; i < 5; i++) {
        await client.post(
          "/api/v1/feedback",
          createTestFeedback({ projectId, title: `List Test ${i}` })
        );
      }

      // Act
      const response = await client.get<{
        items: unknown[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(`/api/v1/feedback?projectId=${projectId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.data?.items).toBeDefined();
      expect(Array.isArray(response.data?.items)).toBe(true);
      expect(response.data?.pagination).toBeDefined();
      expect(response.data?.pagination.page).toBe(1);
    });

    it("should filter by projectId", async () => {
      // Arrange - create feedback for two projects
      const projectA = uniqueId("int-test-filter-a");
      const projectB = uniqueId("int-test-filter-b");

      await client.post(
        "/api/v1/feedback",
        createTestFeedback({ projectId: projectA })
      );
      await client.post(
        "/api/v1/feedback",
        createTestFeedback({ projectId: projectB })
      );

      // Act
      const response = await client.get<{
        items: Array<{ projectId: string }>;
      }>(`/api/v1/feedback?projectId=${projectA}`);

      // Assert
      expect(response.status).toBe(200);
      const allMatch = response.data?.items.every(
        (item) => item.projectId === projectA
      );
      expect(allMatch).toBe(true);
    });

    it("should support pagination parameters", async () => {
      // Act
      const response = await client.get<{
        pagination: { page: number; limit: number };
      }>("/api/v1/feedback?page=2&limit=5");

      // Assert
      expect(response.status).toBe(200);
      expect(response.data?.pagination.page).toBe(2);
      expect(response.data?.pagination.limit).toBe(5);
    });
  });

  describe("GET /api/v1/feedback/:id", () => {
    it("should return a single feedback item", async () => {
      // Arrange - create feedback
      const projectId = uniqueId("int-test-get-single");
      const createResponse = await client.post<{ id: string }>(
        "/api/v1/feedback",
        createTestFeedback({ projectId, title: "Single Get Test" })
      );
      const feedbackId = createResponse.data?.id;

      // Act
      const response = await client.get<{
        id: string;
        title: string;
      }>(`/api/v1/feedback/${feedbackId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.data?.id).toBe(feedbackId);
      expect(response.data?.title).toBe("Single Get Test");
    });

    it("should return 404 for non-existent ID", async () => {
      // Act
      const response = await client.get(
        "/api/v1/feedback/non-existent-id-12345"
      );

      // Assert
      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/v1/feedback/:id", () => {
    it("should update feedback status", async () => {
      // Arrange - create feedback
      const projectId = uniqueId("int-test-update");
      const createResponse = await client.post<{ id: string }>(
        "/api/v1/feedback",
        createTestFeedback({ projectId, status: "pending" })
      );
      const feedbackId = createResponse.data?.id;

      // Act
      const response = await client.patch<{ status: string }>(
        `/api/v1/feedback/${feedbackId}`,
        { status: "in_progress" }
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.data?.status).toBe("in_progress");
    });

    it("should update multiple fields", async () => {
      // Arrange
      const projectId = uniqueId("int-test-multi-update");
      const createResponse = await client.post<{ id: string }>(
        "/api/v1/feedback",
        createTestFeedback({ projectId })
      );
      const feedbackId = createResponse.data?.id;

      // Act
      const response = await client.patch<{
        title: string;
        status: string;
        priority: string;
      }>(`/api/v1/feedback/${feedbackId}`, {
        title: "Updated Title",
        status: "resolved",
        priority: "high",
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.data?.title).toBe("Updated Title");
      expect(response.data?.status).toBe("resolved");
      expect(response.data?.priority).toBe("high");
    });

    it("should return 404 when updating non-existent feedback", async () => {
      // Act
      const response = await client.patch(
        "/api/v1/feedback/non-existent-id",
        { status: "resolved" }
      );

      // Assert
      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/v1/feedback/:id", () => {
    it("should delete feedback", async () => {
      // Arrange - create feedback
      const projectId = uniqueId("int-test-delete");
      const createResponse = await client.post<{ id: string }>(
        "/api/v1/feedback",
        createTestFeedback({ projectId })
      );
      const feedbackId = createResponse.data?.id;

      // Act
      const deleteResponse = await client.delete(
        `/api/v1/feedback/${feedbackId}`
      );

      // Assert
      expect([200, 204]).toContain(deleteResponse.status);

      // Verify deletion
      const getResponse = await client.get(`/api/v1/feedback/${feedbackId}`);
      expect(getResponse.status).toBe(404);
    });

    it("should return 404 when deleting non-existent feedback", async () => {
      // Act
      const response = await client.delete(
        "/api/v1/feedback/non-existent-id"
      );

      // Assert
      expect(response.status).toBe(404);
    });
  });

  describe("Data Consistency", () => {
    it("should maintain data integrity through create-read-update-delete cycle", async () => {
      // Create
      const projectId = uniqueId("int-test-crud");
      const createResponse = await client.post<{
        id: string;
        title: string;
        status: string;
      }>("/api/v1/feedback", createTestFeedback({
        projectId,
        title: "CRUD Test",
        status: "pending",
      }));
      expect(createResponse.status).toBe(201);
      const feedbackId = createResponse.data?.id;

      // Read
      const readResponse = await client.get<{
        id: string;
        title: string;
      }>(`/api/v1/feedback/${feedbackId}`);
      expect(readResponse.status).toBe(200);
      expect(readResponse.data?.title).toBe("CRUD Test");

      // Update
      const updateResponse = await client.patch<{
        title: string;
        status: string;
      }>(`/api/v1/feedback/${feedbackId}`, {
        title: "CRUD Test Updated",
        status: "resolved",
      });
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data?.title).toBe("CRUD Test Updated");
      expect(updateResponse.data?.status).toBe("resolved");

      // Verify update
      const verifyResponse = await client.get<{
        title: string;
        status: string;
      }>(`/api/v1/feedback/${feedbackId}`);
      expect(verifyResponse.data?.title).toBe("CRUD Test Updated");
      expect(verifyResponse.data?.status).toBe("resolved");

      // Delete
      const deleteResponse = await client.delete(
        `/api/v1/feedback/${feedbackId}`
      );
      expect([200, 204]).toContain(deleteResponse.status);

      // Verify deletion
      const deletedResponse = await client.get(
        `/api/v1/feedback/${feedbackId}`
      );
      expect(deletedResponse.status).toBe(404);
    });
  });
});
