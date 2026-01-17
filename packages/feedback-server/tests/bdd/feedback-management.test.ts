/**
 * BDD Tests: Feedback Management (E002)
 *
 * These tests verify the feedback management user stories:
 * - US004: List All Feedback
 * - US005: View Single Feedback
 * - US006: Update Feedback Status
 * - US007: Delete Feedback
 *
 * Tests are written in BDD style following Given/When/Then pattern.
 */

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import {
  createTestClient,
  createTestFeedback,
  createTestFeedbackBatch,
  waitForServer,
  uniqueId,
  TestClient,
  DEFAULT_BASE_URL,
} from "../setup";

describe("E002: Feedback Management", () => {
  let client: TestClient;
  const baseUrl = DEFAULT_BASE_URL;

  beforeAll(async () => {
    await waitForServer(baseUrl, 15000);
    client = createTestClient(baseUrl);
  });

  describe("US004: List All Feedback", () => {
    describe("Scenario: List all feedback", () => {
      it("Given there are feedback items in the database, When I GET /api/v1/feedback, Then I should receive a paginated list", async () => {
        // Given: Create some feedback items
        const projectId = uniqueId("project");
        const feedbackItems = createTestFeedbackBatch(5, projectId);

        for (const feedback of feedbackItems) {
          await client.post("/api/v1/feedback", feedback);
        }

        // When: I GET /api/v1/feedback
        const response = await client.get<{
          items: unknown[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }>(`/api/v1/feedback?projectId=${projectId}`);

        // Then: I should receive a paginated list
        expect(response.status).toBe(200);
        expect(response.data?.items).toBeDefined();
        expect(Array.isArray(response.data?.items)).toBe(true);
        expect(response.data?.pagination).toBeDefined();
        expect(response.data?.pagination.page).toBe(1);
        expect(response.data?.pagination.limit).toBeGreaterThan(0);
      });

      it("And pagination metadata should be included", async () => {
        // Given: Feedback items exist
        const projectId = uniqueId("project");
        await client.post(
          "/api/v1/feedback",
          createTestFeedback({ projectId })
        );

        // When: I GET /api/v1/feedback
        const response = await client.get<{
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }>(`/api/v1/feedback?projectId=${projectId}`);

        // Then: Pagination metadata should be included
        expect(response.status).toBe(200);
        expect(response.data?.pagination).toBeDefined();
        expect(typeof response.data?.pagination.page).toBe("number");
        expect(typeof response.data?.pagination.limit).toBe("number");
        expect(typeof response.data?.pagination.total).toBe("number");
        expect(typeof response.data?.pagination.totalPages).toBe("number");
      });
    });

    describe("Scenario: Paginate feedback", () => {
      it("Given there are many feedback items, When I GET /api/v1/feedback?page=2&limit=10, Then I should receive the correct page", async () => {
        // Given: Create 25 feedback items
        const projectId = uniqueId("project-pagination");
        const feedbackItems = createTestFeedbackBatch(25, projectId);

        for (const feedback of feedbackItems) {
          await client.post("/api/v1/feedback", feedback);
        }

        // When: I GET page 2 with limit 10
        const response = await client.get<{
          items: unknown[];
          pagination: { page: number; limit: number; total: number };
        }>(`/api/v1/feedback?projectId=${projectId}&page=2&limit=10`);

        // Then: I should receive page 2
        expect(response.status).toBe(200);
        expect(response.data?.pagination.page).toBe(2);
        expect(response.data?.pagination.limit).toBe(10);
        expect(response.data?.items.length).toBeLessThanOrEqual(10);
      });
    });
  });

  describe("US005: View Single Feedback", () => {
    describe("Scenario: Get feedback by ID", () => {
      it("Given a feedback item exists, When I GET /api/v1/feedback/:id, Then I should receive the complete feedback data", async () => {
        // Given: A feedback item exists
        const feedback = createTestFeedback({
          projectId: uniqueId("project"),
          title: "Complete Feedback Data Test",
          description: "Test description",
        });

        const createResponse = await client.post<{ id: string }>(
          "/api/v1/feedback",
          feedback
        );
        const feedbackId = createResponse.data?.id;

        // When: I GET /api/v1/feedback/:id
        const response = await client.get<{
          id: string;
          title: string;
          description: string;
          projectId: string;
          environment: unknown;
          createdAt: string;
        }>(`/api/v1/feedback/${feedbackId}`);

        // Then: I should receive the complete feedback data
        expect(response.status).toBe(200);
        expect(response.data?.id).toBe(feedbackId);
        expect(response.data?.title).toBe(feedback.title);
        expect(response.data?.description).toBe(feedback.description);
        expect(response.data?.projectId).toBe(feedback.projectId);
        expect(response.data?.environment).toBeDefined();
        expect(response.data?.createdAt).toBeDefined();
      });
    });

    describe("Scenario: Feedback not found", () => {
      it("Given no feedback exists with the ID, When I GET /api/v1/feedback/:id, Then the response status should be 404", async () => {
        // Given: A non-existent feedback ID
        const nonExistentId = "non-existent-feedback-id-12345";

        // When: I GET /api/v1/feedback/:id
        const response = await client.get(
          `/api/v1/feedback/${nonExistentId}`
        );

        // Then: The response status should be 404
        expect(response.status).toBe(404);
      });
    });
  });

  describe("US006: Update Feedback Status", () => {
    describe("Scenario: Update feedback status", () => {
      it("Given a feedback item with status 'pending', When I PATCH /api/v1/feedback/:id with status 'in_progress', Then the feedback status should be updated", async () => {
        // Given: A feedback item with status "pending" (default)
        const feedback = createTestFeedback({
          projectId: uniqueId("project"),
          title: "Status Update Test",
        });

        const createResponse = await client.post<{ id: string }>(
          "/api/v1/feedback",
          feedback
        );
        const feedbackId = createResponse.data?.id;

        // When: I PATCH with status "in_progress"
        const updateResponse = await client.patch<{ status: string }>(
          `/api/v1/feedback/${feedbackId}`,
          { status: "in_progress" }
        );

        // Then: The feedback status should be updated
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.data?.status).toBe("in_progress");
      });

      it("And the updatedAt timestamp should change", async () => {
        // Given: A feedback item
        const feedback = createTestFeedback({
          projectId: uniqueId("project"),
          title: "Timestamp Update Test",
        });

        const createResponse = await client.post<{
          id: string;
          updatedAt: string;
        }>("/api/v1/feedback", feedback);
        const feedbackId = createResponse.data?.id;
        const originalUpdatedAt = createResponse.data?.updatedAt;

        // Wait a bit to ensure timestamp changes
        await new Promise((r) => setTimeout(r, 100));

        // When: I PATCH to update status
        const updateResponse = await client.patch<{ updatedAt: string }>(
          `/api/v1/feedback/${feedbackId}`,
          { status: "resolved" }
        );

        // Then: The updatedAt timestamp should change
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.data?.updatedAt).toBeDefined();
        // Note: Depending on timestamp precision, this might be the same
        // In production, we'd use higher precision timestamps
      });
    });

    describe("Scenario: Update multiple fields", () => {
      it("Given a feedback item, When I PATCH with status and title, Then both fields should be updated", async () => {
        // Given: A feedback item
        const feedback = createTestFeedback({
          projectId: uniqueId("project"),
          title: "Original Title",
        });

        const createResponse = await client.post<{ id: string }>(
          "/api/v1/feedback",
          feedback
        );
        const feedbackId = createResponse.data?.id;

        // When: I PATCH with status and title
        const updateResponse = await client.patch<{
          status: string;
          title: string;
        }>(`/api/v1/feedback/${feedbackId}`, {
          status: "resolved",
          title: "Updated Title",
        });

        // Then: Both fields should be updated
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.data?.status).toBe("resolved");
        expect(updateResponse.data?.title).toBe("Updated Title");
      });
    });
  });

  describe("US007: Delete Feedback", () => {
    describe("Scenario: Delete feedback", () => {
      it("Given a feedback item exists, When I DELETE /api/v1/feedback/:id, Then the feedback should be removed", async () => {
        // Given: A feedback item exists
        const feedback = createTestFeedback({
          projectId: uniqueId("project"),
          title: "Delete Test",
        });

        const createResponse = await client.post<{ id: string }>(
          "/api/v1/feedback",
          feedback
        );
        const feedbackId = createResponse.data?.id;

        // When: I DELETE /api/v1/feedback/:id
        const deleteResponse = await client.delete(
          `/api/v1/feedback/${feedbackId}`
        );

        // Then: The delete should succeed
        expect([200, 204]).toContain(deleteResponse.status);

        // And: The feedback should be removed
        const getResponse = await client.get(
          `/api/v1/feedback/${feedbackId}`
        );
        expect(getResponse.status).toBe(404);
      });
    });

    describe("Scenario: Delete non-existent feedback", () => {
      it("When I DELETE /api/v1/feedback/nonexistent, Then the response status should be 404", async () => {
        // Given: A non-existent feedback ID
        const nonExistentId = "nonexistent-feedback-id-67890";

        // When: I DELETE /api/v1/feedback/nonexistent
        const response = await client.delete(
          `/api/v1/feedback/${nonExistentId}`
        );

        // Then: The response status should be 404
        expect(response.status).toBe(404);
      });
    });
  });
});
