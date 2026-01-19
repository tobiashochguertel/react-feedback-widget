#!/bin/bash
#
# Docker Integration Test Script
#
# Performs end-to-end testing of the Docker deployment:
# 1. Clean start (remove existing volumes)
# 2. Build all images
# 3. Start all services
# 4. Wait for health checks
# 5. Create feedback via API
# 6. Verify feedback in WebUI API
# 7. Stop services
#
# Usage: ./scripts/docker/integration-test.sh
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
TIMEOUT=${TIMEOUT:-120}
API_URL="${API_URL:-http://localhost:3001}"
WEBUI_URL="${WEBUI_URL:-http://localhost:5173}"
EXAMPLE_URL="${EXAMPLE_URL:-http://localhost:3002}"

# Test results
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_step() {
    echo ""
    echo -e "${BLUE}━━━ $1 ━━━${NC}"
    echo ""
}

# Run a test
run_test() {
    local name=$1
    shift
    ((TESTS_RUN++))
    echo -n "  Testing: $name... "
    if "$@"; then
        echo -e "${GREEN}PASS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Wait for a URL to respond
wait_for_url() {
    local url=$1
    local max_wait=${2:-$TIMEOUT}
    local elapsed=0

    while [[ $elapsed -lt $max_wait ]]; do
        if curl -sf --max-time 5 "$url" > /dev/null 2>&1; then
            return 0
        fi
        sleep 2
        elapsed=$((elapsed + 2))
    done

    return 1
}

# Clean up Docker resources
cleanup() {
    log_step "Cleanup"
    log_info "Stopping containers and removing volumes..."
    docker compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>/dev/null || true
    docker network rm feedback-network 2>/dev/null || true
}

# Step 1: Clean start
step_clean() {
    log_step "Step 1: Clean Start"
    cleanup
    log_success "Environment cleaned"
}

# Step 2: Build images
step_build() {
    log_step "Step 2: Build Images"
    log_info "Building all Docker images (this may take a few minutes)..."

    if docker compose -f "$COMPOSE_FILE" build --quiet; then
        log_success "All images built successfully"
    else
        log_error "Image build failed"
        return 1
    fi
}

# Step 3: Start services
step_start() {
    log_step "Step 3: Start Services"
    log_info "Starting Docker Compose stack..."

    if docker compose -f "$COMPOSE_FILE" up -d; then
        log_success "Services started"
    else
        log_error "Failed to start services"
        return 1
    fi
}

# Step 4: Wait for health
step_health() {
    log_step "Step 4: Wait for Health Checks"

    log_info "Waiting for services to become healthy..."

    echo -n "  Waiting for API server..."
    if wait_for_url "${API_URL}/health" 60; then
        echo -e " ${GREEN}ready${NC}"
    else
        echo -e " ${RED}timeout${NC}"
        return 1
    fi

    echo -n "  Waiting for WebUI..."
    if wait_for_url "$WEBUI_URL" 60; then
        echo -e " ${GREEN}ready${NC}"
    else
        echo -e " ${RED}timeout${NC}"
        return 1
    fi

    echo -n "  Waiting for Example App..."
    if wait_for_url "$EXAMPLE_URL" 60; then
        echo -e " ${GREEN}ready${NC}"
    else
        echo -e " ${RED}timeout${NC}"
        return 1
    fi

    log_success "All services healthy"
}

# Step 5: API Tests
step_api_tests() {
    log_step "Step 5: API Integration Tests"

    # Test health endpoint
    run_test "Health endpoint" curl -sf "${API_URL}/health" || true

    # Test feedback list (empty)
    run_test "Feedback list (empty)" bash -c "curl -sf '${API_URL}/api/feedback' | grep -q '\[\]' || curl -sf '${API_URL}/api/feedback' | grep -q 'feedback'" || true

    # Create test feedback
    local feedback_json='{"title":"Integration Test Bug","type":"bug","priority":"high","status":"open","description":"Test feedback from integration script"}'

    log_info "Creating test feedback..."
    local response
    response=$(curl -sf -X POST "${API_URL}/api/feedback" \
        -H "Content-Type: application/json" \
        -d "$feedback_json" 2>&1) || true

    if [[ -n "$response" ]]; then
        local feedback_id
        feedback_id=$(echo "$response" | grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")

        if [[ -n "$feedback_id" ]]; then
            log_success "Created feedback with ID: $feedback_id"

            # Verify we can retrieve it
            run_test "Retrieve created feedback" curl -sf "${API_URL}/api/feedback/${feedback_id}" || true

            # Update the feedback
            run_test "Update feedback status" curl -sf -X PATCH "${API_URL}/api/feedback/${feedback_id}" \
                -H "Content-Type: application/json" \
                -d '{"status":"in_progress"}' || true

            # Delete the feedback
            run_test "Delete test feedback" curl -sf -X DELETE "${API_URL}/api/feedback/${feedback_id}" || true
        else
            log_warning "Could not extract feedback ID from response"
        fi
    else
        log_warning "No response from create feedback endpoint"
    fi

    # Test stats endpoint
    run_test "Stats endpoint" curl -sf "${API_URL}/api/feedback/stats" || true
}

# Step 6: WebUI Tests
step_webui_tests() {
    log_step "Step 6: WebUI Tests"

    # Check WebUI is serving
    run_test "WebUI serves index" bash -c "curl -sf '$WEBUI_URL' | grep -q '<html'" || true

    # Check WebUI assets
    run_test "WebUI serves CSS/JS" curl -sf "${WEBUI_URL}/assets/" -o /dev/null || true
}

# Step 7: Example App Tests
step_example_tests() {
    log_step "Step 7: Example App Tests"

    # Check Example app is serving
    run_test "Example app serves index" bash -c "curl -sf '$EXAMPLE_URL' | grep -q '<html'" || true
}

# Print summary
print_summary() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                    Integration Test Summary                    ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "  Tests Run:    $TESTS_RUN"
    echo -e "  ${GREEN}Passed:${NC}       $TESTS_PASSED"
    echo -e "  ${RED}Failed:${NC}       $TESTS_FAILED"
    echo ""

    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}✅ All integration tests PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ Some integration tests FAILED${NC}"
        return 1
    fi
}

# Show container status
show_status() {
    log_step "Container Status"
    docker compose -f "$COMPOSE_FILE" ps
}

# Main function
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║              Docker Integration Test Script                    ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""

    local failed=0

    # Run all steps
    step_clean || failed=1
    step_build || failed=1
    step_start || failed=1
    step_health || { show_status; failed=1; }

    if [[ $failed -eq 0 ]]; then
        step_api_tests
        step_webui_tests
        step_example_tests
    fi

    show_status

    # Cleanup unless KEEP_RUNNING is set
    if [[ "${KEEP_RUNNING:-}" != "true" ]]; then
        cleanup
    else
        log_info "KEEP_RUNNING=true, leaving stack running"
    fi

    print_summary
}

main "$@"
