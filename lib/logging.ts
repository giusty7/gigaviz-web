const DEV = process.env.NODE_ENV === "development";

type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = meta ? { ...meta } : {};
  console[level](`[${level}] ${message}`, Object.keys(payload).length ? payload : "");
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    log("info", msg, meta);
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    log("warn", msg, meta);
  },
  error: (msg: string, meta?: Record<string, unknown>) => {
    log("error", msg, meta);
  },
  dev: (msg: string, meta?: Record<string, unknown>) => {
    if (DEV) log("info", msg, meta);
  },
};
