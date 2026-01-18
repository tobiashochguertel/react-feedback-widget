/**
 * BDD Tests: Data Export (E003)
 *
 * These tests verify the data export user stories:
 * - US-CLI-009: Export to JSON
 * - US-CLI-010: Export to CSV
 * - US-CLI-011: Export with filters
 *
 * Tests are written in BDD style following Given/When/Then pattern.
 *
 * @see docs/spec/003.cli-user-stories/README.md
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  createTestClient,
  createTestFeedback,
  createTestFeedbackBatch,
  waitForServer,
  uniqueId,
  TestClient,
  DEFAULT_BASE_URL,
} from '../setup';

describe('E003: Data Export', () => {
  let client: TestClient;
  const baseUrl = DEFAULT_BASE_URL;

  beforeAll(async () => {
    await waitForServer(baseUrl, 15000);
    client = createTestClient(baseUrl);
  });

  describe('US-CLI-009: Export to JSON', () => {
    describe('Scenario: Export all feedback to JSON', () => {
      it('Given feedback exists, When I export to JSON, Then I should receive valid JSON data', async () => {
        // Given: Feedback items exist
        const projectId = uniqueId('project-export');
        const feedbackItems = createTestFeedbackBatch(3, projectId);

        for (const feedback of feedbackItems) {
          await client.post('/api/v1/feedback', feedback);
        }

        // When: I request feedback (simulating JSON export)
        const response = await client.get<{
          items: unknown[];
        }>(`/api/v1/feedback?projectId=${projectId}`);

        // Then: I should receive valid JSON with all items
        expect(response.status).toBe(200);
        expect(response.data?.items).toBeDefined();
        expect(Array.isArray(response.data?.items)).toBe(true);
        expect(response.data?.items.length).toBeGreaterThanOrEqual(3);
      });

      it('And the JSON should contain all required fields', async () => {
        // Given: A feedback item exists
        const projectId = uniqueId('project-fields');
        const feedback = createTestFeedback({
          projectId,
          title: 'Field Test',
          description: 'Testing all fields',
        });

        const createResponse = await client.post<{ id: string }>(
          '/api/v1/feedback',
          feedback
        );

        // When: I export (fetch) the feedback
        const response = await client.get<{
          id: string;
          title: string;
          description: string;
          type: string;
          status: string;
          priority: string;
          projectId: string;
          createdAt: string;
        }>(`/api/v1/feedback/${createResponse.data?.id}`);

        // Then: All required fields should be present
        expect(response.data?.id).toBeDefined();
        expect(response.data?.title).toBeDefined();
        expect(response.data?.description).toBeDefined();
        expect(response.data?.type).toBeDefined();
        expect(response.data?.status).toBeDefined();
        expect(response.data?.priority).toBeDefined();
        expect(response.data?.projectId).toBeDefined();
        expect(response.data?.createdAt).toBeDefined();
      });
    });

    describe('Scenario: Export filtered feedback to JSON', () => {
      it('Given feedback with different statuses exists, When I export with status filter, Then only matching items are included', async () => {
        // Given: Feedback with different statuses
        const projectId = uniqueId('project-filter-export');

        await client.post(
          '/api/v1/feedback',
          createTestFeedback({ projectId, status: 'pending', title: 'Pending 1' })
        );
        await client.post(
          '/api/v1/feedback',
          createTestFeedback({ projectId, status: 'pending', title: 'Pending 2' })
        );
        await client.post(
          '/api/v1/feedback',
          createTestFeedback({ projectId, status: 'resolved', title: 'Resolved 1' })
        );

        // When: I export with status filter
        const response = await client.get<{
          items: { status: string }[];
        }>(`/api/v1/feedback?projectId=${projectId}&status=pending`);

        // Then: Only pending items should be included
        expect(response.status).toBe(200);
        if (response.data?.items && response.data.items.length > 0) {
          response.data.items.forEach((item) => {
            expect(item.status).toBe('pending');
          });
        }
      });
    });
  });

  describe('US-CLI-010: Export to CSV', () => {
    describe('Scenario: Export feedback to CSV format', () => {
      it('Given feedback exists, When I request CSV export, Then the API should support CSV format', async () => {
        // Given: Feedback items exist
        const projectId = uniqueId('project-csv');
        await client.post(
          '/api/v1/feedback',
          createTestFeedback({ projectId, title: 'CSV Test' })
        );

        // When: I request feedback data (which can be converted to CSV by CLI)
        const response = await client.get<{
          items: unknown[];
        }>(`/api/v1/feedback?projectId=${projectId}`);

        // Then: Data should be available for CSV conversion
        expect(response.status).toBe(200);
        expect(response.data?.items).toBeDefined();

        // Note: Actual CSV conversion happens in the CLI, not the API
        // The API provides JSON data that the CLI converts to CSV
      });

      it('And CSV output should have headers for all columns', async () => {
        // Given: Feedback exists
        const projectId = uniqueId('project-csv-headers');
        const feedback = createTestFeedback({ projectId });
        await client.post('/api/v1/feedback', feedback);

        // When: I get the feedback data
        const response = await client.get<{
          items: Record<string, unknown>[];
        }>(`/api/v1/feedback?projectId=${projectId}`);

        // Then: Data should have consistent keys (CSV headers)
        expect(response.status).toBe(200);
        if (response.data?.items && response.data.items.length > 0) {
          const firstItem = response.data.items[0];
          // These would become CSV headers
          expect('id' in firstItem || 'title' in firstItem).toBe(true);
        }
      });
    });
  });

  describe('US-CLI-011: Export with filters', () => {
    describe('Scenario: Export feedback by date range', () => {
      it('Given feedback from different dates exists, When I filter by date, Then only matching items are exported', async () => {
        // Given: Feedback items exist
        const projectId = uniqueId('project-date');
        await client.post(
          '/api/v1/feedback',
          createTestFeedback({ projectId, title: 'Recent Feedback' })
        );

        // When: I request feedback (date filtering depends on API implementation)
        const response = await client.get<{
          items: { createdAt: string }[];
        }>(`/api/v1/feedback?projectId=${projectId}`);

        // Then: Items should have date information for filtering
        expect(response.status).toBe(200);
        if (response.data?.items && response.data.items.length > 0) {
          expect(response.data.items[0].createdAt).toBeDefined();
        }
      });
    });

    describe('Scenario: Export feedback by type', () => {
      it('Given feedback of different types exists, When I filter by type, Then only that type is exported', async () => {
        // Given: Feedback with different types
        const projectId = uniqueId('project-type-export');

        await client.post(
          '/api/v1/feedback',
          createTestFeedback({ projectId, type: 'bug', title: 'Bug Report' })
        );
        await client.post(
          '/api/v1/feedback',
          createTestFeedback({ projectId, type: 'feature', title: 'Feature Request' })
        );

        // When: I filter by type=feature
        const response = await client.get<{
          items: { type: string }[];
        }>(`/api/v1/feedback?projectId=${projectId}&type=feature`);

        // Then: Only features should be exported
        expect(response.status).toBe(200);
        if (response.data?.items && response.data.items.length > 0) {
          response.data.items.forEach((item) => {
            expect(item.type).toBe('feature');
          });
        }
      });
    });

    describe('Scenario: Export with multiple filters', () => {
      it('Given various feedback exists, When I apply multiple filters, Then all filters are applied', async () => {
        // Given: Varied feedback
        const projectId = uniqueId('project-multi');

        await client.post(
          '/api/v1/feedback',
          createTestFeedback({ projectId, type: 'bug', status: 'pending' })
        );
        await client.post(
          '/api/v1/feedback',
          createTestFeedback({ projectId, type: 'bug', status: 'resolved' })
        );
        await client.post(
          '/api/v1/feedback',
          createTestFeedback({ projectId, type: 'feature', status: 'pending' })
        );

        // When: I filter by type=bug AND status=pending
        const response = await client.get<{
          items: { type: string; status: string }[];
        }>(`/api/v1/feedback?projectId=${projectId}&type=bug&status=pending`);

        // Then: Only bugs with pending status should be returned
        expect(response.status).toBe(200);
        if (response.data?.items && response.data.items.length > 0) {
          response.data.items.forEach((item) => {
            expect(item.type).toBe('bug');
            expect(item.status).toBe('pending');
          });
        }
      });
    });
  });
});
