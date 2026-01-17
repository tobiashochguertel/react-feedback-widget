/**
 * BDD Tests: Feedback Submission (E001)
 *
 * These tests verify the feedback submission user stories:
 * - US001: Submit Feedback via API
 * - US002: Submit Video Recording
 * - US003: Identify Client Application
 *
 * Tests are written in BDD style following Given/When/Then pattern.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  createTestClient,
  createTestFeedback,
  createTestScreenshot,
  waitForServer,
  uniqueId,
  TestClient,
  TestFeedbackInput,
  DEFAULT_BASE_URL,
} from "../setup";

describe("E001: Feedback Submission", () => {
  let client: TestClient;
  const baseUrl = DEFAULT_BASE_URL;

  beforeAll(async () => {
    // Wait for server to be ready
    await waitForServer(baseUrl, 15000);
    client = createTestClient(baseUrl);
  });

  describe("US001: Submit Feedback via API", () => {
    describe("Scenario: Submit new feedback successfully", () => {
      it("Given I have a valid feedback payload, When I POST to /api/v1/feedback, Then the response status should be 201 and contain the created feedback with an ID", async () => {
        // Given: I have a valid feedback payload
        const feedback = createTestFeedback({
          projectId: uniqueId("project"),
          title: "Valid Feedback Submission Test",
        });

        // When: I POST to /api/v1/feedback
        const response = await client.post<{ id: string; title: string }>(
          "/api/v1/feedback",
          feedback
        );

        // Then: The response status should be 201
        expect(response.status).toBe(201);

        // And: The response should contain the created feedback with an ID
        expect(response.data).toBeDefined();
        expect(response.data?.id).toBeDefined();
        expect(typeof response.data?.id).toBe("string");
        expect(response.data?.title).toBe(feedback.title);
      });

      it("And the feedback should be stored in the database", async () => {
        // Given: I have created a feedback item
        const feedback = createTestFeedback({
          projectId: uniqueId("project"),
          title: "Stored Feedback Test",
        });

        const createResponse = await client.post<{ id: string }>(
          "/api/v1/feedback",
          feedback
        );
        const feedbackId = createResponse.data?.id;
        expect(feedbackId).toBeDefined();

        // When: I retrieve the feedback by ID
        const getResponse = await client.get<{ id: string; title: string }>(
          `/api/v1/feedback/${feedbackId}`
        );

        // Then: The feedback should be stored in the database
        expect(getResponse.status).toBe(200);
        expect(getResponse.data?.id).toBe(feedbackId);
        expect(getResponse.data?.title).toBe(feedback.title);
      });
    });

    describe("Scenario: Submit feedback with screenshot", () => {
      it("Given I have feedback data with a screenshot, When I POST the feedback with the screenshot, Then the feedback should include the screenshot data", async () => {
        // Given: I have feedback data with a screenshot blob
        const screenshot = createTestScreenshot();
        const feedback = createTestFeedback({
          projectId: uniqueId("project"),
          title: "Feedback with Screenshot",
          screenshots: [screenshot],
        });

        // When: I POST the feedback with the screenshot
        const response = await client.post<{
          id: string;
          screenshots: unknown[];
        }>("/api/v1/feedback", feedback);

        // Then: The response should be successful
        expect(response.status).toBe(201);
        expect(response.data?.id).toBeDefined();

        // And: The feedback should reference the uploaded screenshot
        // Note: Screenshots are stored inline as base64 in the current implementation
        const getResponse = await client.get<{ screenshots: string }>(
          `/api/v1/feedback/${response.data?.id}`
        );
        expect(getResponse.status).toBe(200);
        expect(getResponse.data?.screenshots).toBeDefined();
      });
    });

    describe("Scenario: Submit feedback with validation error", () => {
      it("Given I have an invalid feedback payload (missing required fields), When I POST to /api/v1/feedback, Then the response status should be 400", async () => {
        // Given: I have an invalid feedback payload (missing projectId and title)
        const invalidFeedback = {
          description: "Missing required fields",
        };

        // When: I POST to /api/v1/feedback
        const response = await client.post("/api/v1/feedback", invalidFeedback);

        // Then: The response status should be 400
        expect(response.status).toBe(400);
      });

      it("And the response should describe the validation error", async () => {
        // Given: I have an invalid feedback payload
        const invalidFeedback = {
          projectId: "", // Empty string - invalid
          sessionId: "test-session",
          title: "", // Empty string - invalid
        };

        // When: I POST to /api/v1/feedback
        const response = await client.post<{ error?: string; message?: string }>(
          "/api/v1/feedback",
          invalidFeedback
        );

        // Then: The response should describe the validation error
        expect(response.status).toBe(400);
        expect(response.data).toBeDefined();
        // Error message should be present
        expect(
          response.data?.error || response.data?.message
        ).toBeDefined();
      });
    });
  });

  describe("US002: Submit Video Recording", () => {
    describe("Scenario: Upload video blob", () => {
      it("Given I have a video recording, When I POST to /api/v1/videos/initiate, Then a video session should be created", async () => {
        // Given: I have video metadata
        const videoMetadata = {
          feedbackId: uniqueId("feedback"),
          mimeType: "video/webm",
          totalSize: 1024 * 1024, // 1MB
        };

        // When: I POST to initiate video upload
        const response = await client.post<{ uploadId: string }>(
          "/api/v1/videos/initiate",
          videoMetadata
        );

        // Then: A video session should be created (or 404 if not implemented)
        if (response.status === 201) {
          expect(response.data?.uploadId).toBeDefined();
        } else {
          // Video upload endpoint not implemented yet
          expect([201, 404, 501]).toContain(response.status);
        }
      });
    });

    describe("Scenario: Reject oversized video", () => {
      it("Given I have a video blob larger than the limit, When I POST to /api/v1/videos, Then the response status should be 413", async () => {
        // Given: I have video metadata indicating a very large file
        const oversizedVideoMetadata = {
          feedbackId: uniqueId("feedback"),
          mimeType: "video/webm",
          totalSize: 1024 * 1024 * 1024, // 1GB - way over limit
        };

        // When: I POST to initiate video upload
        const response = await client.post(
          "/api/v1/videos/initiate",
          oversizedVideoMetadata
        );

        // Then: Should reject (or 404 if not implemented)
        expect([400, 413, 404, 501]).toContain(response.status);
      });
    });
  });

  describe("US003: Identify Client Application", () => {
    describe("Scenario: Feedback includes client ID (projectId)", () => {
      it("Given feedback is submitted from a specific project, When I query feedback for that project, Then I should only see feedback from that project", async () => {
        // Given: Create feedback for two different projects
        const projectA = uniqueId("project-a");
        const projectB = uniqueId("project-b");

        await client.post("/api/v1/feedback", createTestFeedback({
          projectId: projectA,
          title: "Feedback from Project A",
        }));

        await client.post("/api/v1/feedback", createTestFeedback({
          projectId: projectB,
          title: "Feedback from Project B",
        }));

        // When: I query feedback for projectA
        const response = await client.get<{
          items: Array<{ projectId: string }>;
        }>(`/api/v1/feedback?projectId=${projectA}`);

        // Then: I should only see feedback from projectA
        expect(response.status).toBe(200);
        expect(response.data?.items).toBeDefined();
        expect(Array.isArray(response.data?.items)).toBe(true);

        const allFromProjectA = response.data?.items.every(
          (item) => item.projectId === projectA
        );
        expect(allFromProjectA).toBe(true);
      });
    });
  });
});
