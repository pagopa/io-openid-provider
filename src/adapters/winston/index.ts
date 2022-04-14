import winston from "winston";
import { Logger } from "../../domain/logger";

// These levels are taken from winston.config.NpmConfigSetLevels,
// so use something like keyof winston.config.NpmConfigSetLevels
export type LogLevel =
  | "error"
  | "warn"
  | "info"
  | "http"
  | "verbose"
  | "debug"
  | "silly";

export interface LogConfig {
  readonly logLevel: LogLevel;
  readonly logName: string;
}

export const makeLogger = (config: LogConfig): Logger =>
  winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.splat(),
      winston.format.simple(),
      winston.format.printf(
        (info) =>
          `${info.timestamp} [${info.level}] [${config.logName}]: ${info.message}`
      )
    ),
    transports: [new winston.transports.Console({ level: config.logLevel })],
  });
