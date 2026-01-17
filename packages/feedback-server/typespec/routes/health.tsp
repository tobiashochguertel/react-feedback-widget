import "@typespec/http";

using Http;

namespace FeedbackServer.Routes;

/**
 * Health check status
 */
enum HealthStatus {
  healthy,
  degraded,
  unhealthy,
}

/**
 * Component health status
 */
model ComponentHealth {
  /** Component name */
  name: string;

  /** Health status */
  status: HealthStatus;

  /** Response time in ms */
  responseTime?: int32;

  /** Error message if unhealthy */
  error?: string;
}

/**
 * Health check response
 */
model HealthResponse {
  /** Overall status */
  status: HealthStatus;

  /** Server version */
  version: string;

  /** Server uptime in seconds */
  uptime: int64;

  /** Timestamp */
  @format("date-time")
  timestamp: string;

  /** Component health (database, cache, etc.) */
  components?: ComponentHealth[];
}

@route("/api/v1/health")
@tag("Health")
interface HealthRoutes {
  /**
   * Basic health check
   */
  @get
  @summary("Health check")
  check(): HealthResponse;

  /**
   * Detailed health check with component status
   */
  @get
  @route("/detailed")
  @summary("Detailed health check")
  detailed(): HealthResponse;

  /**
   * Readiness probe for Kubernetes
   */
  @get
  @route("/ready")
  @summary("Readiness probe")
  ready(): {
    ready: boolean;
  };

  /**
   * Liveness probe for Kubernetes
   */
  @get
  @route("/live")
  @summary("Liveness probe")
  live(): {
    alive: boolean;
  };
}

@route("/api/v1/info")
@tag("Info")
interface InfoRoutes {
  /**
   * Get server information
   */
  @get
  @summary("Server info")
  info(): {
    /** Server name */
    name: string;
    /** Server version */
    version: string;
    /** API version */
    apiVersion: string;
    /** Supported features */
    features: string[];
    /** Documentation URL */
    docsUrl?: string;
  };
}
