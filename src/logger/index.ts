import winston from "winston";

type Logger = winston.Logger;
type LogLevel =
  | "emerg"
  | "alert"
  | "crit"
  | "error"
  | "warning"
  | "notice"
  | "info"
  | "debug";

interface LogConfig {
  readonly logLevel: LogLevel;
  readonly logName: string;
}

/**
 * Create a Winston logger given a configuration.
 *
 * @param logConfig the configuration to use to create a new logger.
 * @return a bunyan logger.
 */
const makeLogger = (logConfig: LogConfig): Logger =>
  winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.splat(),
      winston.format.simple(),
      winston.format.printf(
        (info) => `${info.timestamp} [${info.level}]: ${info.message}`
      )
    ),
    transports: [new winston.transports.Console({ level: logConfig.logLevel })],
  });

/**
 * Create a Winston child logger given a logger and the component name.
 *
 * @param logger the logger from which create a sub logger.
 * @param componentName the name of the sub logger.
 * @return a bunyan logger.
 */
const makeSubLogger = (logger: Logger, componentName: string): Logger =>
  logger.child({ component: componentName });

export { makeLogger, makeSubLogger, Logger, LogLevel, LogConfig };
