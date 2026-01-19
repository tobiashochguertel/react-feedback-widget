#!/bin/bash
#
# Health Check Validation Script
#
# Starts the Docker Compose stack and validates all service health endpoints.
# Waits for services to become healthy and reports results.
#
# Usage: ./scripts/docker/validate-health.sh
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMEOUT=${TIMEOUT:-120}  # Total timeout in seconds
INTERVAL=${INTERVAL:-5}  # Check interval in seconds
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

# Services to check (service_name:port:path)
SERVICES=(
    "feedback-server:3001:/health"
    "feedback-webui:5173:/"
    "feedback-example:3002:/"
)

# Results
PASSED=0
FAILED=0

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi

    if ! docker compose version &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not available${NC}"
        exit 1
    fi

    log_info "Docker Compose: $(docker compose version)"
}

# Start the Docker Compose stack
start_stack() {
    log_info "Starting Docker Compose stack..."

    if ! docker compose -f "$COMPOSE_FILE" up -d; then
        log_error "Failed to start Docker Compose stack"
        exit 1
    fi

    log_info "Stack started, waiting for services to initialize..."
    sleep 5
}

# Stop the Docker Compose stack
stop_stack() {
    log_info "Stopping Docker Compose stack..."
    docker compose -f "$COMPOSE_FILE" down --remove-orphans || true
}

# Check if a service is healthy via HTTP
check_http_health() {
    local service=$1
    local port=$2
    local path=$3
    local url="http://localhost:${port}${path}"

    local elapsed=0

    while [[ $elapsed -lt $TIMEOUT ]]; do
        if curl -sf --max-time 5 "$url" > /dev/null 2>&1; then
            return 0
        fi
        sleep "$INTERVAL"
        elapsed=$((elapsed + INTERVAL))
        echo -n "."
    done

    return 1
}

# Check Docker health status
check_container_health() {
    local container=$1
    local elapsed=0

    while [[ $elapsed -lt $TIMEOUT ]]; do
        local health
        health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")

        case "$health" in
            "healthy")
                return 0
                ;;
            "unhealthy")
                return 1
                ;;
            "starting")
                sleep "$INTERVAL"
                elapsed=$((elapsed + INTERVAL))
                echo -n "."
                ;;
            *)
                # No health check configured, check if running
                local state
                state=$(docker inspect --format='{{.State.Running}}' "$container" 2>/dev/null || echo "false")
                if [[ "$state" == "true" ]]; then
                    return 0
                fi
                sleep "$INTERVAL"
                elapsed=$((elapsed + INTERVAL))
                echo -n "."
                ;;
        esac
    done

    return 1
}

# Check all services
check_services() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Checking Service Health"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    for service_spec in "${SERVICES[@]}"; do
        IFS=':' read -r service port path <<< "$service_spec"

        echo -n "  Checking $service (port $port)..."

        if check_http_health "$service" "$port" "$path"; then
            echo ""
            log_success "$service: HTTP endpoint responding at localhost:${port}${path}"
        else
            echo ""
            log_error "$service: HTTP endpoint not responding after ${TIMEOUT}s"
        fi
    done

    # Check PostgreSQL via Docker health
    echo ""
    echo -n "  Checking postgres (container health)..."
    if check_container_health "postgres"; then
        echo ""
        log_success "postgres: Container is healthy"
    else
        echo ""
        log_error "postgres: Container health check failed"
    fi
}

# Show container status
show_status() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Container Status"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    docker compose -f "$COMPOSE_FILE" ps
}

# Show logs on failure
show_logs_on_failure() {
    if [[ $FAILED -gt 0 ]]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Recent Logs (for debugging)"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        docker compose -f "$COMPOSE_FILE" logs --tail=20
    fi
}

# Print summary
print_summary() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Summary"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "  ${GREEN}Passed:${NC} $PASSED"
    echo -e "  ${RED}Failed:${NC} $FAILED"
    echo ""

    if [[ $FAILED -gt 0 ]]; then
        echo -e "${RED}❌ Health Validation FAILED${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Health Validation PASSED${NC}"
        return 0
    fi
}

# Cleanup on exit
cleanup() {
    local exit_code=$?
    if [[ "${KEEP_RUNNING:-}" != "true" ]]; then
        stop_stack
    else
        log_info "KEEP_RUNNING=true, leaving stack running"
    fi
    exit $exit_code
}

# Main function
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║              Health Check Validation Script                    ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""

    check_docker_compose

    # Set up cleanup trap
    trap cleanup EXIT

    start_stack
    check_services
    show_status
    show_logs_on_failure
    print_summary
}

main "$@"
