#!/bin/sh
# =============================================================================
# Feedback Server Entrypoint Script
# =============================================================================
# Handles startup tasks before launching the main server:
# - Wait for database (if PostgreSQL)
# - Run migrations (if RUN_MIGRATIONS=true)
# - Validate required directories
# - Start the server
# =============================================================================

set -e

# -----------------------------------------------------------------------------
# Logging Functions
# -----------------------------------------------------------------------------

log_info() {
    echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') $*"
}

log_error() {
    echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') $*" >&2
}

log_warn() {
    echo "[WARN] $(date '+%Y-%m-%d %H:%M:%S') $*" >&2
}

# -----------------------------------------------------------------------------
# Wait for PostgreSQL
# -----------------------------------------------------------------------------

wait_for_postgres() {
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL not set"
        return 1
    fi

    # Check if using PostgreSQL (not SQLite)
    case "$DATABASE_URL" in
        postgresql://*|postgres://*)
            log_info "Detected PostgreSQL database"

            # Extract host and port
            host=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
            port=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')

            if [ -z "$host" ]; then
                log_error "Could not parse host from DATABASE_URL"
                return 1
            fi

            port=${port:-5432}
            timeout=${DB_WAIT_TIMEOUT:-60}

            log_info "Waiting for PostgreSQL at $host:$port (timeout: ${timeout}s)..."

            elapsed=0
            while [ $elapsed -lt $timeout ]; do
                if nc -z "$host" "$port" 2>/dev/null; then
                    log_info "PostgreSQL is ready!"
                    return 0
                fi
                sleep 2
                elapsed=$((elapsed + 2))
            done

            log_error "Timeout waiting for PostgreSQL at $host:$port"
            return 1
            ;;
        file:*)
            log_info "Using SQLite database"
            return 0
            ;;
        *)
            log_warn "Unknown database type, proceeding anyway"
            return 0
            ;;
    esac
}

# -----------------------------------------------------------------------------
# Run Migrations
# -----------------------------------------------------------------------------

run_migrations() {
    if [ "${RUN_MIGRATIONS:-false}" != "true" ]; then
        log_info "Migrations disabled (RUN_MIGRATIONS != true)"
        return 0
    fi

    log_info "Running database migrations..."

    if bun run db:migrate; then
        log_info "Migrations completed successfully"
        return 0
    else
        log_error "Migrations failed"
        return 1
    fi
}

# -----------------------------------------------------------------------------
# Validate Directories
# -----------------------------------------------------------------------------

validate_directories() {
    # Check data directory
    if [ ! -d "/app/data" ]; then
        log_info "Creating data directory..."
        mkdir -p /app/data
    fi

    if [ ! -w "/app/data" ]; then
        log_error "Data directory /app/data is not writable"
        return 1
    fi

    # Check uploads directory
    if [ ! -d "/app/uploads" ]; then
        log_info "Creating uploads directory..."
        mkdir -p /app/uploads
    fi

    if [ ! -w "/app/uploads" ]; then
        log_error "Uploads directory /app/uploads is not writable"
        return 1
    fi

    log_info "Directories validated"
    return 0
}

# -----------------------------------------------------------------------------
# Main Startup
# -----------------------------------------------------------------------------

main() {
    echo ""
    echo "=============================================="
    echo "  Feedback Server"
    echo "=============================================="
    echo "  Time: $(date)"
    echo "  Environment: ${NODE_ENV:-development}"
    echo "  Port: ${PORT:-3001}"
    echo "=============================================="
    echo ""

    # Validate directories
    if ! validate_directories; then
        exit 1
    fi

    # Wait for database if PostgreSQL
    if ! wait_for_postgres; then
        exit 1
    fi

    # Run migrations if enabled
    if ! run_migrations; then
        exit 1
    fi

    # Start the server
    log_info "Starting Feedback Server..."
    exec bun run dist/index.js
}

# Run main function
main "$@"
