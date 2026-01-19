#!/bin/bash
#
# Docker Build Validation Script
#
# Validates that all Docker images can be built successfully.
# Checks image existence, size, and reports results.
#
# Usage: ./scripts/docker/validate-builds.sh
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY="${DOCKER_REGISTRY:-docker.io}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Images to validate
IMAGES=(
    "feedback-server"
    "feedback-server-webui"
    "feedback-example"
    "react-visual-feedback"
    "feedback-server-cli"
)

# Package paths
declare -A PACKAGE_PATHS=(
    ["feedback-server"]="packages/feedback-server"
    ["feedback-server-webui"]="packages/feedback-server-webui"
    ["feedback-example"]="packages/feedback-example"
    ["react-visual-feedback"]="packages/react-visual-feedback"
    ["feedback-server-cli"]="packages/feedback-server-cli"
)

# Results
PASSED=0
FAILED=0
SKIPPED=0

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
    echo -e "${YELLOW}[SKIP]${NC} $1"
    ((SKIPPED++))
}

# Check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo -e "${RED}Error: Docker daemon is not running${NC}"
        exit 1
    fi

    log_info "Docker is available: $(docker --version)"
}

# Build an image
build_image() {
    local name=$1
    local path=${PACKAGE_PATHS[$name]}
    local full_name="${name}:${IMAGE_TAG}"

    if [[ ! -d "$path" ]]; then
        log_warning "$name: Package directory not found at $path"
        return 1
    fi

    if [[ ! -f "$path/Dockerfile" ]]; then
        log_warning "$name: Dockerfile not found"
        return 1
    fi

    log_info "Building $full_name from $path..."

    if docker build -t "$full_name" "$path" --quiet > /dev/null 2>&1; then
        log_success "$name: Build successful"
        return 0
    else
        log_error "$name: Build failed"
        return 1
    fi
}

# Check image exists and get size
check_image() {
    local name=$1
    local full_name="${name}:${IMAGE_TAG}"

    if docker image inspect "$full_name" &> /dev/null; then
        local size
        size=$(docker image inspect "$full_name" --format='{{.Size}}' | awk '{printf "%.2f MB", $1/1024/1024}')
        log_info "$name: Image size = $size"
        return 0
    else
        log_error "$name: Image not found"
        return 1
    fi
}

# Validate image has required labels
check_labels() {
    local name=$1
    local full_name="${name}:${IMAGE_TAG}"

    local maintainer
    maintainer=$(docker image inspect "$full_name" --format='{{index .Config.Labels "maintainer"}}' 2>/dev/null || echo "")

    if [[ -n "$maintainer" ]]; then
        log_info "$name: Maintainer = $maintainer"
    fi
}

# Run all validations
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║              Docker Build Validation Script                    ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""

    check_docker

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Building Images"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    for image in "${IMAGES[@]}"; do
        build_image "$image" || true
    done

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Checking Images"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    for image in "${IMAGES[@]}"; do
        check_image "$image" || true
        check_labels "$image"
    done

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Summary"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "  ${GREEN}Passed:${NC}  $PASSED"
    echo -e "  ${RED}Failed:${NC}  $FAILED"
    echo -e "  ${YELLOW}Skipped:${NC} $SKIPPED"
    echo ""

    if [[ $FAILED -gt 0 ]]; then
        echo -e "${RED}❌ Validation FAILED${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Validation PASSED${NC}"
        exit 0
    fi
}

main "$@"
