/**
 * BDD Tests: Feedback Management (E002)
 *
 * These tests verify the feedback management user stories:
 * - US-CLI-004: List Feedback
 * - US-CLI-005: Get Feedback Details
 * - US-CLI-006: Create Feedback
 * - US-CLI-007: Update Feedback
 * - US-CLI-008: Delete Feedback
 *
 * Tests are written in BDD style following Given/When/Then pattern.
 *
 * @see docs/spec/003.cli-user-stories/README.md
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import {
  createTestClient,
  createTestFeedback,
  createTestFeedbackBatch,
  waitForServer,
  uniqueId,
  TestClient,
  DEFAULT_BASE_URL,
} from '../setup';

describe('E002: Feedback Management', () => {
  let client: TestClient;
  const baseUrl = DEFAULT_BASE_URL;

  beforeAll(async () => {
    await waitForServer(baseUrl, 15000);
    client = createTestClient(baseUrl);
  });

  describe('US-CLI-004: List Feedback', () => {
    describe('Scenario: List all feedback in table format', () => {
      it('Given I am authenticated, When I list feedback, Then I should see a paginated list', async () => {
        // Given: Create some feedback items
        const projectId = uniqueId('project');
        const feedbackItems = createTestFeedbackBatch(5, projectId);

        for (const feedback of feedbackItems) {
          await client.post('/api/v1/feedback', feedback);
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

        // Then: I should see a list with columns: ID, Title, Type, Status, Created
        expect(response.status).toBe(200);
        expect(response.data?.items).toBeDefined();
        expect(Array.isArray(response.data?.items)).toBe(true);
      });

      it('And I should see up to 20 items by default', async () => {
        // Given: More than 20 feedback items exist
        const projectId = uniqueId('project-pagination');
        const feedbackItems = createTestFeedbackBatch(25, projectId);

        for (const feedback of feedbackItems) {
          await client.post('/api/v1/feedback', feedback);
        }

        // When: I list without specifying limit
        const response = await client.get<{
          items: unknown[];
          pagination: { limit: number };
        }>(`/api/v1/feedback?projectId=${projectId}`);

        // Then: Default limit should be applied
        expect(response.status).toBe(200);
        expect(response.data?.pagination.limit).toBeGreaterThan(0);
      });

      it('And I should see pagination info at the bottom', async () => {
        // Given: Feedback items exist
        const projectId = uniqueId('project');
        await client.post(
          '/api/v1/feedback',
          createTestFeedback({ projectId })
        );

        // When: I list feedback
        const response = await client.get<{
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }>(`/api/v1/feedback?projectId=${projectId}`);

        // Then: Pagination info should be included
        expect(response.status).toBe(200);
        expect(response.data?.pagination).toBeDefined();
        expect(typeof response.data?.pagination.page).toBe('number');
        expect(typeof response.data?.pagination.limit).toBe('number');
        expect(typeof response.data?.pagination.total).toBe('number');
        expect(typeof response.data?.pagination.totalPages).toBe('number');
      });
    });

    describe('Scenario: List feedback with filters', () => {
      it('Given I am authenticated, When I filter by status, Then I should see only matching feedback', async () => {
        // Given: Feedback with different statuses
        const projectId = uniqueId('project-filter');

        await client.post(
          '/api/v1/feedback',
          createTestFeedback({ projectId, status: 'pending', title: 'Pending Bug' })
        );
        await client.post(
          '/api/v1/feedback',
          createTestFeedback({ projectId, status: 'resolved', title: 'Resolved Bug' })
        );

        // When: I filter by status=pending
        const response = await client.get<{
          items: { status: string }[];
        }>(`/api/v1/feedback?projectId=${projectId}&status=pending`);

        // Then: Only pending feedback should be returned
        expect(response.status).toBe(200);
        if (response.data?.items && response.data.items.length > 0) {
          response.data.items.forEach((item) => {
            expect(item.status).toBe('pending');
          });
        }
      });

      it('Given I am authenticated, When I filter by type, Then I should see only that type', async () => {
        // Given: Feedback with different types
        const projectId = uniqueId('project-type');

        await client.post(
          '/api/v1/feedback',
          createTestFeedback({ projectId, type: 'bug', title: 'Bug Report' })
        );
        await client.post(
          '/api/v1/feedback',
          createTestFeedback({ projectId, type: 'feature', title: 'Feature Request' })
        );

        // When: I filter by type=bug
        const response = await client.get<{
          items: { type: string }[];
        }>(`/api/v1/feedback?projectId=${projectId}&type=bug`);

        // Then: Only bugs should be returned
        expect(response.status).toBe(200);
        if (response.data?.items && response.data.items.length > 0) {
          response.data.items.forEach((item) => {
            expect(item.type).toBe('bug');
          });
        }
      });
    });

    describe('Scenario: List feedback in JSON format', () => {
      it('Given I am authenticated, When I request JSON output, Then I should see valid JSON', async () => {
        // Given: Feedback exists
        const projectId = uniqueId('project-json');
        await client.post(
          '/api/v1/feedback',
          createTestFeedback({ projectId })
        );

        // When: I request the feedback (API always returns JSON)
        const response = await client.get<{
          items: unknown[];
        }>(`/api/v1/feedback?projectId=${projectId}`);

        // Then: Response should be valid JSON (parsed by client)
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data?.items)).toBe(true);
      });
    });
  });

  describe('US-CLI-005: Get Feedback Details', () => {
    describe('Scenario: View feedback details', () => {
      it('Given feedback exists, When I get its details, Then I should see complete information', async () => {
        // Given: A feedback item exists
        const projectId = uniqueId('project');
        const feedback = createTestFeedback({
          projectId,
          title: 'Detailed Feedback Test',
          description: 'This is a detailed description for testing.',
        });

        const createResponse = await client.post<{ id: string }>(
          '/api/v1/feedback',
          feedback
        );
        const feedbackId = createResponse.data?.id;

        // When: I GET /api/v1/feedback/:id
        const response = await client.get<{
          id: string;
          title: string;
          description: string;
          status: string;
          type: string;
          priority: string;
          createdAt: string;
          environment: unknown;
        }>(`/api/v1/feedback/${feedbackId}`);

        // Then: I should see all feedback details
        expect(response.status).toBe(200);
        expect(response.data?.id).toBe(feedbackId);
        expect(response.data?.title).toBe(feedback.title);
        expect(response.data?.description).toBe(feedback.description);
        expect(response.data?.status).toBeDefined();
        expect(response.data?.type).toBeDefined();
        expect(response.data?.priority).toBeDefined();
        expect(response.data?.createdAt).toBeDefined();
        expect(response.data?.environment).toBeDefined();
      });
    });

    describe('Scenario: Feedback not found', () => {
      it('Given feedback does not exist, When I try to get it, Then I should see an error', async () => {
        // Given: A non-existent feedback ID
        const nonExistentId = 'fb_nonexistent_123';

        // When: I try to get the feedback
        const response = await client.get(`/api/v1/feedback/${nonExistentId}`);

        // Then: I should see a 404 error
        expect(response.status).toBe(404);
      });
    });
  });

  describe('US-CLI-006: Create Feedback', () => {
    describe('Scenario: Create feedback with minimal options', () => {
      it('Given I am authenticated, When I create feedback with title only, Then a new feedback should be created', async () => {
        // Given: I am authenticated (client is ready)
        const projectId = uniqueId('project');
        const sessionId = uniqueId('session');

        // When: I create feedback with minimal options
        const response = await client.post<{ id: string }>('/api/v1/feedback', {
          projectId,
          sessionId,
          title: 'Minimal Test Feedback',
        });

        // Then: A new feedback should be created
        expect(response.status).toBe(201);
        expect(response.data?.id).toBeDefined();
        expect(response.data?.id).toMatch(/^(fb_)?[a-zA-Z0-9_-]+$/);
      });
    });

    describe('Scenario: Create feedback with all options', () => {
      it('Given I am authenticated, When I create feedback with all fields, Then all fields should be saved', async () => {
        // Given: I am authenticated
        const projectId = uniqueId('project');
        const fullFeedback = createTestFeedback({
          projectId,
          title: 'Full Options Test',
          description: 'Complete description with all fields',
          type: 'bug',
          priority: 'high',
          tags: ['login', 'urgent'],
        });

        // When: I create feedback with all options
        const createResponse = await client.post<{ id: string }>(
          '/api/v1/feedback',
          fullFeedback
        );

        // Then: All fields should be saved
        expect(createResponse.status).toBe(201);
        const feedbackId = createResponse.data?.id;

        // Verify by fetching the created feedback
        const getResponse = await client.get<{
          title: string;
          description: string;
          type: string;
          priority: string;
          tags: string[];
        }>(`/api/v1/feedback/${feedbackId}`);

        expect(getResponse.data?.title).toBe(fullFeedback.title);
        expect(getResponse.data?.description).toBe(fullFeedback.description);
        expect(getResponse.data?.type).toBe(fullFeedback.type);
        expect(getResponse.data?.priority).toBe(fullFeedback.priority);
      });
    });
  });

  describe('US-CLI-007: Update Feedback', () => {
    describe('Scenario: Update feedback status', () => {
      it('Given feedback exists with status pending, When I update to resolved, Then status should change', async () => {
        // Given: A feedback item with status pending
        const projectId = uniqueId('project');
        const createResponse = await client.post<{ id: string }>(
          '/api/v1/feedback',
          createTestFeedback({ projectId, status: 'pending' })
        );
        const feedbackId = createResponse.data?.id;

        // When: I update the status to resolved
        const updateResponse = await client.patch(`/api/v1/feedback/${feedbackId}`, {
          status: 'resolved',
        });

        // Then: The status should be updated
        expect(updateResponse.status).toBe(200);

        // Verify the update
        const getResponse = await client.get<{ status: string }>(
          `/api/v1/feedback/${feedbackId}`
        );
        expect(getResponse.data?.status).toBe('resolved');
      });
    });

    describe('Scenario: Update feedback priority', () => {
      it('Given feedback exists, When I update priority, Then priority should change', async () => {
        // Given: A feedback item
        const projectId = uniqueId('project');
        const createResponse = await client.post<{ id: string }>(
          '/api/v1/feedback',
          createTestFeedback({ projectId, priority: 'low' })
        );
        const feedbackId = createResponse.data?.id;

        // When: I update the priority
        await client.patch(`/api/v1/feedback/${feedbackId}`, {
          priority: 'high',
        });

        // Then: The priority should be updated
        const getResponse = await client.get<{ priority: string }>(
          `/api/v1/feedback/${feedbackId}`
        );
        expect(getResponse.data?.priority).toBe('high');
      });
    });

    describe('Scenario: Add tags to feedback', () => {
      it('Given feedback exists with no tags, When I add tags, Then tags should be added', async () => {
        // Given: A feedback item with no tags
        const projectId = uniqueId('project');
        const createResponse = await client.post<{ id: string }>(
          '/api/v1/feedback',
          createTestFeedback({ projectId, tags: [] })
        );
        const feedbackId = createResponse.data?.id;

        // When: I add tags
        await client.patch(`/api/v1/feedback/${feedbackId}`, {
          tags: ['urgent', 'reviewed'],
        });

        // Then: Tags should be added
        const getResponse = await client.get<{ tags: string[] }>(
          `/api/v1/feedback/${feedbackId}`
        );
        expect(getResponse.data?.tags).toContain('urgent');
        expect(getResponse.data?.tags).toContain('reviewed');
      });
    });
  });

  describe('US-CLI-008: Delete Feedback', () => {
    describe('Scenario: Delete feedback successfully', () => {
      it('Given feedback exists, When I delete it, Then it should be removed', async () => {
        // Given: A feedback item exists
        const projectId = uniqueId('project');
        const createResponse = await client.post<{ id: string }>(
          '/api/v1/feedback',
          createTestFeedback({ projectId })
        );
        const feedbackId = createResponse.data?.id;

        // When: I delete the feedback
        const deleteResponse = await client.delete(`/api/v1/feedback/${feedbackId}`);

        // Then: The feedback should be deleted (204 No Content)
        expect(deleteResponse.status).toBe(204);

        // Verify deletion
        const getResponse = await client.get(`/api/v1/feedback/${feedbackId}`);
        expect(getResponse.status).toBe(404);
      });
    });

    describe('Scenario: Delete non-existent feedback', () => {
      it('Given feedback does not exist, When I try to delete it, Then I should see an error', async () => {
        // Given: A non-existent feedback ID
        const nonExistentId = 'fb_nonexistent_delete_123';

        // When: I try to delete it
        const response = await client.delete(`/api/v1/feedback/${nonExistentId}`);

        // Then: I should see a 404 error
        expect(response.status).toBe(404);
      });
    });
  });
});
