import * as winston from "winston";

// I'm just lazy, so create just an alias for now
export type Logger = Pick<winston.Logger, "error" | "warn" | "info" | "debug">;
