/**
 * BDD Tests: Data Portability (E004)
 *
 * These tests verify the data portability user stories:
 * - US010: Export All Feedback
 * - US011: Import Feedback
 * - US012: Bulk Delete Feedback
 *
 * Tests are written in BDD style following Given/When/Then pattern.
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  createTestClient,
  createTestFeedback,
  createTestFeedbackBatch,
  waitForServer,
  uniqueId,
  TestClient,
  DEFAULT_BASE_URL,
} from "../setup";

describe("E004: Data Portability", () => {
  let client: TestClient;
  const baseUrl = DEFAULT_BASE_URL;

  beforeAll(async () => {
    await waitForServer(baseUrl, 15000);
    client = createTestClient(baseUrl);
  });

  describe("US010: Export All Feedback", () => {
    describe("Scenario: Export as CSV (default format)", () => {
      it("Given there are feedback items, When I GET /api/v1/feedback/export, Then I should receive all feedback in CSV format", async () => {
        // Given: Create some feedback items
        const projectId = uniqueId("export-project");
        const feedbackItems = createTestFeedbackBatch(3, projectId);

        for (const feedback of feedbackItems) {
          await client.post("/api/v1/feedback", feedback);
        }

        // When: I GET /api/v1/feedback/export
        const response = await fetch(
          `${baseUrl}/api/v1/feedback/export?projectId=${projectId}`,
          {
            method: "GET",
            headers: {
              Accept: "text/csv",
            },
          }
        );

        // Then: Should receive CSV data
        expect(response.status).toBe(200);
        const contentType = response.headers.get("content-type");
        // Server returns text/plain for CSV
        expect(contentType).toMatch(/text\/(csv|plain)/);

        const text = await response.text();
        // CSV should have header row
        expect(text).toContain("id");
        expect(text).toContain("projectId");
      });
    });

    describe("Scenario: Export with Content-Disposition header", () => {
      it("Given there are feedback items, When I GET /api/v1/feedback/export, Then I should receive a downloadable file", async () => {
        // Given: Feedback items exist
        const projectId = uniqueId("export-csv-project");
        await client.post(
          "/api/v1/feedback",
          createTestFeedback({ projectId })
        );

        // When: I GET /api/v1/feedback/export
        const response = await fetch(
          `${baseUrl}/api/v1/feedback/export?projectId=${projectId}`,
          {
            method: "GET",
          }
        );

        // Then: Should receive CSV file with proper headers
        expect(response.status).toBe(200);
        const contentDisposition = response.headers.get("content-disposition");
        // Should have attachment header for file download
        expect(contentDisposition).toMatch(/attachment/);
        expect(contentDisposition).toMatch(/\.csv/);
      });
    });
  });

  describe("US011: Import Feedback", () => {
    describe("Scenario: Import JSON data", () => {
      it("Given I have valid feedback data in JSON, When I POST /api/v1/feedback/import, Then the feedback should be created", async () => {
        // Given: Valid feedback data in JSON format (server expects 'items' field)
        const projectId = uniqueId("import-project");
        const importData = {
          items: [
            createTestFeedback({ projectId, title: "Imported Feedback 1" }),
            createTestFeedback({ projectId, title: "Imported Feedback 2" }),
          ],
        };

        // When: I POST /api/v1/feedback/import
        const response = await client.post<{
          success: boolean;
          imported: number;
          failed: number;
          importedIds: string[];
        }>("/api/v1/feedback/import", importData);

        // Then: Feedback should be created (server returns 201)
        expect(response.status).toBe(201);
        expect(response.data?.success).toBe(true);
        expect(response.data?.imported).toBe(2);
        expect(response.data?.importedIds).toHaveLength(2);
      });
    });

    describe("Scenario: Import with validation errors", () => {
      it("Given I have invalid feedback data, When I POST /api/v1/feedback/import, Then I should receive validation errors", async () => {
        // Given: Invalid feedback data - using wrong field name 'data' instead of 'items'
        const invalidImportData = {
          data: [
            { invalid: "data" },
          ],
        };

        // When: I POST /api/v1/feedback/import
        const response = await client.post<{
          success: boolean;
          error: string;
          details: unknown[];
        }>("/api/v1/feedback/import", invalidImportData);

        // Then: Should receive validation error (400 - expected array for items)
        expect(response.status).toBe(400);
        expect(response.data?.success).toBe(false);
        expect(response.data?.error).toBe("Invalid request format");
      });
    });
  });

  describe("US012: Bulk Delete Feedback", () => {
    describe("Scenario: Delete by IDs (server requires IDs in body)", () => {
      it("Given there are feedback items for a project, When I DELETE /api/v1/feedback/bulk with IDs, Then those items should be deleted", async () => {
        // Given: Create feedback items for a specific project
        const projectId = uniqueId("bulk-delete-project");
        const createdIds: string[] = [];

        for (let i = 0; i < 3; i++) {
          const response = await client.post<{ id: string }>(
            "/api/v1/feedback",
            createTestFeedback({ projectId, title: `Bulk Delete ${i}` })
          );
          if (response.data?.id) {
            createdIds.push(response.data.id);
          }
        }

        expect(createdIds.length).toBe(3);

        // When: I DELETE /api/v1/feedback/bulk with IDs in body
        const deleteResponse = await client.delete<{ deleted: number }>(
          "/api/v1/feedback/bulk",
          { ids: createdIds }
        );

        // Then: All items should be deleted
        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.data?.deleted).toBe(3);

        // Verify deletion
        for (const id of createdIds) {
          const getResponse = await client.get(`/api/v1/feedback/${id}`);
          expect(getResponse.status).toBe(404);
        }
      });
    });

    describe("Scenario: Partial delete by IDs", () => {
      it("Given I have specific feedback IDs, When I DELETE /api/v1/feedback/bulk with subset of IDs, Then only those specific items should be deleted", async () => {
        // Given: Create feedback items and get their IDs
        const projectId = uniqueId("bulk-delete-ids-project");
        const createdIds: string[] = [];

        for (let i = 0; i < 3; i++) {
          const response = await client.post<{ id: string }>(
            "/api/v1/feedback",
            createTestFeedback({ projectId, title: `Bulk Delete Test ${i}` })
          );
          if (response.data?.id) {
            createdIds.push(response.data.id);
          }
        }

        expect(createdIds.length).toBe(3);

        // When: I DELETE /api/v1/feedback/bulk with first 2 IDs
        const deleteResponse = await client.delete<{ deleted: number }>(
          "/api/v1/feedback/bulk",
          { ids: createdIds.slice(0, 2) }
        );

        // Then: Only first 2 items should be deleted
        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.data?.deleted).toBe(2);

        // Verify first 2 are deleted
        for (const id of createdIds.slice(0, 2)) {
          const getResponse = await client.get(`/api/v1/feedback/${id}`);
          expect(getResponse.status).toBe(404);
        }

        // Verify last one still exists
        const lastResponse = await client.get(
          `/api/v1/feedback/${createdIds[2]}`
        );
        expect(lastResponse.status).toBe(200);
      });
    });
  });
});
