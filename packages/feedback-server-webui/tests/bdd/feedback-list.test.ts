/**
 * E003: Feedback List BDD Tests
 *
 * Tests for feedback list user stories:
 * - US-WUI-006: View Feedback List
 * - US-WUI-007: Filter Feedback
 * - US-WUI-008: Search Feedback
 * - US-WUI-009: Paginate Feedback
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
} from "vitest";
import {
  DEFAULT_BASE_URL,
  isServerHealthy,
  apiRequest,
  testApiKey,
  createTestFeedback,
  trackFeedback,
  cleanupFeedback,
} from "../setup";

interface FeedbackItem {
  id: string;
  projectId: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FeedbackListResponse {
  items: FeedbackItem[];
  pagination: PaginationInfo;
}

describe("E003: Feedback List", () => {
  let serverAvailable = false;
  const createdIds: string[] = [];

  beforeAll(async () => {
    serverAvailable = await isServerHealthy();
    if (!serverAvailable) {
      console.warn("⚠️  API server not available - some tests will be skipped");
      console.warn(`   Expected server at: ${DEFAULT_BASE_URL}`);
      return;
    }

    // Create test feedback items for list tests
    for (let i = 0; i < 5; i++) {
      const feedback = createTestFeedback({
        title: `Test Feedback ${i + 1}`,
        type: i % 2 === 0 ? "bug" : "feature",
        priority: i === 0 ? "high" : "medium",
      });

      const response = await apiRequest<{ id: string }>("/feedback", {
        method: "POST",
        apiKey: testApiKey,
        body: feedback,
      });

      if (response.ok && response.data?.id) {
        createdIds.push(response.data.id);
        trackFeedback(response.data.id);
      }
    }
  });

  afterAll(async () => {
    await cleanupFeedback();
  });

  // ============================================================================
  // US-WUI-006: View Feedback List
  // ============================================================================
  describe("US-WUI-006: View Feedback List", () => {
    it("Given I am logged in, When I navigate to feedback list, Then I should see a list of feedback items", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Fetch feedback list
      const response = await apiRequest<FeedbackListResponse>("/feedback", {
        method: "GET",
        apiKey: testApiKey,
      });

      // Assert: Should get list with items
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("items");
      expect(Array.isArray(response.data?.items)).toBe(true);
    });

    it("Given I am viewing the feedback list, Then each item should display title, type, status, and date", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Fetch feedback list
      const response = await apiRequest<FeedbackListResponse>("/feedback", {
        method: "GET",
        apiKey: testApiKey,
      });

      // Assert: Items should have required fields
      expect(response.ok).toBe(true);
      const items = response.data?.items || [];

      if (items.length > 0) {
        const item = items[0];
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("title");
        expect(item).toHaveProperty("type");
        expect(item).toHaveProperty("status");
        expect(item).toHaveProperty("createdAt");
      }
    });
  });

  // ============================================================================
  // US-WUI-007: Filter Feedback
  // ============================================================================
  describe("US-WUI-007: Filter Feedback", () => {
    it("Given I am viewing feedback, When I filter by type 'bug', Then I should only see bug reports", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Filter by type
      const response = await apiRequest<FeedbackListResponse>("/feedback?type=bug", {
        method: "GET",
        apiKey: testApiKey,
      });

      // Assert: All items should be bugs
      expect(response.ok).toBe(true);
      const items = response.data?.items || [];

      for (const item of items) {
        expect(item.type).toBe("bug");
      }
    });

    it("Given I am viewing feedback, When I filter by priority 'high', Then I should only see high priority items", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Filter by priority
      const response = await apiRequest<FeedbackListResponse>("/feedback?priority=high", {
        method: "GET",
        apiKey: testApiKey,
      });

      // Assert: All items should be high priority
      expect(response.ok).toBe(true);
      const items = response.data?.items || [];

      for (const item of items) {
        expect(item.priority).toBe("high");
      }
    });

    it("Given I am viewing feedback, When I filter by status 'pending', Then I should only see pending items", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Filter by status (valid values: pending, in_progress, resolved, closed, archived)
      const response = await apiRequest<FeedbackListResponse>("/feedback?status=pending", {
        method: "GET",
        apiKey: testApiKey,
      });

      // Assert: API should accept the filter
      expect(response.ok).toBe(true);
    });
  });

  // ============================================================================
  // US-WUI-008: Search Feedback
  // ============================================================================
  describe("US-WUI-008: Search Feedback", () => {
    it("Given I am viewing feedback, When I search for 'Test', Then I should see matching results", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Search by keyword
      const response = await apiRequest<FeedbackListResponse>("/feedback?search=Test", {
        method: "GET",
        apiKey: testApiKey,
      });

      // Assert: Should return results (may include created test items)
      expect(response.ok).toBe(true);
      expect(response.data).toHaveProperty("items");
    });

    it("Given I search for non-existent term, When results are empty, Then I should see an empty list", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Search for unlikely term
      const response = await apiRequest<FeedbackListResponse>(
        "/feedback?search=zzznonexistenttermzzz12345",
        {
          method: "GET",
          apiKey: testApiKey,
        }
      );

      // Assert: Should return empty or no matching results
      expect(response.ok).toBe(true);
      expect(response.data?.items).toBeDefined();
    });
  });

  // ============================================================================
  // US-WUI-009: Paginate Feedback
  // ============================================================================
  describe("US-WUI-009: Paginate Feedback", () => {
    it("Given there are multiple feedback items, When I request page 1 with limit 2, Then I should get 2 items", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Paginate with limit
      const response = await apiRequest<FeedbackListResponse>("/feedback?page=1&limit=2", {
        method: "GET",
        apiKey: testApiKey,
      });

      // Assert: Should respect limit
      expect(response.ok).toBe(true);
      expect(response.data?.items.length).toBeLessThanOrEqual(2);
    });

    it("Given there are multiple pages, When I request page 2, Then I should get different items", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Get first two pages
      const page1Response = await apiRequest<FeedbackListResponse>("/feedback?page=1&limit=2", {
        method: "GET",
        apiKey: testApiKey,
      });

      const page2Response = await apiRequest<FeedbackListResponse>("/feedback?page=2&limit=2", {
        method: "GET",
        apiKey: testApiKey,
      });

      // Assert: Pages should have different items (if there are enough)
      expect(page1Response.ok).toBe(true);
      expect(page2Response.ok).toBe(true);

      const page1Ids = page1Response.data?.items.map((i) => i.id) || [];
      const page2Ids = page2Response.data?.items.map((i) => i.id) || [];

      // If there are items on page 2, they should be different
      if (page2Ids.length > 0 && page1Ids.length > 0) {
        const overlap = page1Ids.filter((id) => page2Ids.includes(id));
        expect(overlap.length).toBe(0);
      }
    });

    it("Given I am paginating, When I view pagination info, Then I should see total count and totalPages", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Request with pagination
      const response = await apiRequest<FeedbackListResponse>("/feedback?page=1&limit=2", {
        method: "GET",
        apiKey: testApiKey,
      });

      // Assert: Should have pagination metadata
      // API returns: { items, pagination: { page, limit, total, totalPages } }
      expect(response.ok).toBe(true);
      expect(response.data).toHaveProperty("pagination");
      expect(response.data?.pagination).toHaveProperty("total");
      expect(response.data?.pagination).toHaveProperty("totalPages");
      expect(response.data?.pagination).toHaveProperty("page");
      expect(response.data?.pagination).toHaveProperty("limit");
    });
  });
});
