/**
 * Ops Console: Health Monitoring Types
 */

export type HealthCheckType =
  | "database"
  | "api"
  | "worker"
  | "external_service"
  | "storage"
  | "cache";

export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export type HealthCheck = {
  id: string;
  checkType: HealthCheckType;
  checkName: string;
  status: HealthStatus;
  responseTimeMs: number | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  checkedAt: string;
  createdAt: string;
};

export type SystemMetric = {
  id: string;
  metricName: string;
  metricValue: number;
  metricUnit: string | null;
  tags: Record<string, unknown>;
  recordedAt: string;
  createdAt: string;
};

export type WorkerHeartbeat = {
  id: string;
  workerName: string;
  workerType: string;
  status: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  errorCount: number;
  lastError: string | null;
  metadata: Record<string, unknown>;
  heartbeatAt: string;
  createdAt: string;
};

export type SystemOverview = {
  workspaces: {
    total: number;
    active_24h: number;
  };
  users: {
    total: number;
    active_24h: number;
  };
  tickets: {
    total: number;
    open: number;
  };
  database: {
    size_bytes: number;
    size_mb: number;
  };
  timestamp: string;
};

export type LatestHealthStatus = {
  checkType: HealthCheckType;
  checkName: string;
  status: HealthStatus;
  responseTimeMs: number | null;
  errorMessage: string | null;
  checkedAt: string;
};

export type StaleWorker = {
  workerName: string;
  workerType: string;
  status: string;
  lastHeartbeat: string;
  minutesSinceHeartbeat: number;
};
