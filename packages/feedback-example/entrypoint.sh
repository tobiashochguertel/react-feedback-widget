#!/bin/sh
# =============================================================================
# Feedback Example App Entrypoint Script
# =============================================================================

set -e

log_info() {
    echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') $*"
}

log_error() {
    echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') $*" >&2
}

# Wait for feedback-server if configured
wait_for_server() {
    if [ -n "$FEEDBACK_SERVER_URL" ]; then
        log_info "Waiting for Feedback Server at $FEEDBACK_SERVER_URL..."

        timeout=${SERVER_WAIT_TIMEOUT:-30}
        elapsed=0

        while [ $elapsed -lt "$timeout" ]; do
            if curl -sf "$FEEDBACK_SERVER_URL/api/v1/health" >/dev/null 2>&1; then
                log_info "Feedback Server is ready!"
                return 0
            fi
            sleep 2
            elapsed=$((elapsed + 2))
        done

        log_error "Timeout waiting for Feedback Server"
        # Continue anyway - server might come up later
    fi
}

main() {
    echo ""
    echo "=============================================="
    echo "  Feedback Example App"
    echo "=============================================="
    echo "  Time: $(date)"
    echo "  Environment: ${NODE_ENV:-development}"
    echo "  Port: ${PORT:-3002}"
    echo "=============================================="
    echo ""

    # Wait for feedback server (optional)
    wait_for_server

    # Start the Next.js server using bun (handles bun-specific symlinks)
    log_info "Starting Next.js server with bun..."
    cd /workspace/packages/feedback-example
    exec bun server.js
}

main "$@"
