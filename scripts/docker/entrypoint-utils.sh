#!/bin/sh
# =============================================================================
# Entrypoint Utilities Library
# =============================================================================
# Source this file in your entrypoint scripts:
#   . /app/entrypoint-utils.sh
#
# Functions:
#   log_info     - Print info message with timestamp
#   log_warn     - Print warning message with timestamp
#   log_error    - Print error message with timestamp
#   check_var    - Check if required environment variable is set
#   wait_for     - Wait for a TCP service to be ready
#   run_migrations - Run database migrations
# =============================================================================

# Colors for output (disabled if not a TTY)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

# -----------------------------------------------------------------------------
# Logging Functions
# -----------------------------------------------------------------------------

log_info() {
    echo "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $*"
}

log_warn() {
    echo "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') $*" >&2
}

log_error() {
    echo "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $*" >&2
}

log_debug() {
    if [ "${DEBUG:-false}" = "true" ] || [ "${LOG_LEVEL:-info}" = "debug" ]; then
        echo "${BLUE}[DEBUG]${NC} $(date '+%Y-%m-%d %H:%M:%S') $*"
    fi
}

# -----------------------------------------------------------------------------
# Environment Variable Validation
# -----------------------------------------------------------------------------

# Check if a required environment variable is set
# Usage: check_var VAR_NAME
check_var() {
    var_name="$1"
    eval var_value="\$$var_name"

    if [ -z "$var_value" ]; then
        log_error "Required environment variable $var_name is not set"
        return 1
    fi

    log_debug "Variable $var_name is set"
    return 0
}

# Check multiple required variables
# Usage: check_required_vars "VAR1 VAR2 VAR3"
check_required_vars() {
    vars="$1"
    missing=""

    for var in $vars; do
        eval value="\$$var"
        if [ -z "$value" ]; then
            missing="$missing $var"
        fi
    done

    if [ -n "$missing" ]; then
        log_error "Missing required environment variables:$missing"
        return 1
    fi

    return 0
}

# -----------------------------------------------------------------------------
# Service Health Checks
# -----------------------------------------------------------------------------

# Wait for a TCP service to be ready
# Usage: wait_for host port [timeout] [interval]
# Example: wait_for postgres 5432 30 2
wait_for() {
    host="$1"
    port="$2"
    timeout="${3:-30}"
    interval="${4:-2}"

    log_info "Waiting for $host:$port to be ready (timeout: ${timeout}s)..."

    elapsed=0
    while [ $elapsed -lt $timeout ]; do
        # Try to connect using various methods available
        if command -v nc >/dev/null 2>&1; then
            if nc -z "$host" "$port" 2>/dev/null; then
                log_info "$host:$port is ready!"
                return 0
            fi
        elif command -v bash >/dev/null 2>&1; then
            if (echo > /dev/tcp/"$host"/"$port") 2>/dev/null; then
                log_info "$host:$port is ready!"
                return 0
            fi
        elif command -v curl >/dev/null 2>&1; then
            if curl -s --connect-timeout 1 "telnet://$host:$port" >/dev/null 2>&1; then
                log_info "$host:$port is ready!"
                return 0
            fi
        else
            # Fallback: try wget
            if wget -q --spider --timeout=1 "http://$host:$port" 2>/dev/null; then
                log_info "$host:$port is ready!"
                return 0
            fi
        fi

        sleep $interval
        elapsed=$((elapsed + interval))
        log_debug "Still waiting for $host:$port... (${elapsed}s elapsed)"
    done

    log_error "Timeout waiting for $host:$port after ${timeout}s"
    return 1
}

# Wait for PostgreSQL to be ready (with query check)
# Usage: wait_for_postgres [timeout]
wait_for_postgres() {
    timeout="${1:-60}"

    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL not set, cannot wait for PostgreSQL"
        return 1
    fi

    # Extract host and port from DATABASE_URL
    # postgresql://user:pass@host:port/db
    host=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    port=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

    if [ -z "$host" ] || [ -z "$port" ]; then
        log_error "Could not parse host/port from DATABASE_URL"
        return 1
    fi

    log_info "Waiting for PostgreSQL at $host:$port..."
    wait_for "$host" "$port" "$timeout"
}

# Wait for HTTP health endpoint
# Usage: wait_for_http url [timeout] [interval]
wait_for_http() {
    url="$1"
    timeout="${2:-30}"
    interval="${3:-2}"

    log_info "Waiting for $url to be ready (timeout: ${timeout}s)..."

    elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if curl -sf "$url" >/dev/null 2>&1; then
            log_info "$url is ready!"
            return 0
        fi

        sleep $interval
        elapsed=$((elapsed + interval))
        log_debug "Still waiting for $url... (${elapsed}s elapsed)"
    done

    log_error "Timeout waiting for $url after ${timeout}s"
    return 1
}

# -----------------------------------------------------------------------------
# Permission Checks
# -----------------------------------------------------------------------------

# Check if a directory is writable
# Usage: check_writable /path/to/dir
check_writable() {
    dir="$1"

    if [ ! -d "$dir" ]; then
        log_warn "Directory $dir does not exist, attempting to create..."
        if ! mkdir -p "$dir" 2>/dev/null; then
            log_error "Cannot create directory $dir"
            return 1
        fi
    fi

    if [ ! -w "$dir" ]; then
        log_error "Directory $dir is not writable"
        return 1
    fi

    log_debug "Directory $dir is writable"
    return 0
}

# Ensure directories exist and are writable
# Usage: ensure_dirs "/path/dir1 /path/dir2"
ensure_dirs() {
    dirs="$1"

    for dir in $dirs; do
        if ! check_writable "$dir"; then
            return 1
        fi
    done

    return 0
}

# -----------------------------------------------------------------------------
# Database Migrations
# -----------------------------------------------------------------------------

# Run database migrations
# Usage: run_migrations [command]
# Default command: bun run db:migrate
run_migrations() {
    migration_cmd="${1:-bun run db:migrate}"

    if [ "${RUN_MIGRATIONS:-false}" != "true" ]; then
        log_debug "RUN_MIGRATIONS not set to true, skipping migrations"
        return 0
    fi

    log_info "Running database migrations..."

    if eval "$migration_cmd"; then
        log_info "Migrations completed successfully"
        return 0
    else
        log_error "Migrations failed"
        return 1
    fi
}

# -----------------------------------------------------------------------------
# Startup Helpers
# -----------------------------------------------------------------------------

# Print startup banner
# Usage: startup_banner "Service Name"
startup_banner() {
    service_name="$1"
    echo ""
    echo "=============================================="
    echo "  ${service_name}"
    echo "=============================================="
    echo "  Time: $(date)"
    echo "  Node: ${NODE_ENV:-development}"
    echo "=============================================="
    echo ""
}

# Execute main command with exec (replaces shell process)
# Usage: exec_cmd command args...
exec_cmd() {
    log_info "Starting: $*"
    exec "$@"
}

# -----------------------------------------------------------------------------
# Signal Handling
# -----------------------------------------------------------------------------

# Set up graceful shutdown handler
# Usage: setup_shutdown_handler [cleanup_function]
setup_shutdown_handler() {
    cleanup_func="${1:-true}"

    trap "$cleanup_func; exit 0" TERM INT
    trap "$cleanup_func; exit 1" HUP
}
