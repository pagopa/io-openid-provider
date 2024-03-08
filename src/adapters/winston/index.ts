import { initAppInsights } from "@pagopa/ts-commons/lib/appinsights.js";
import { pipe } from "fp-ts/lib/function.js";

import { TelemetryClient } from "applicationinsights";
import winston from "winston";
import Transport from "winston-transport";

export class ApplicationInsightTransport extends Transport {
  constructor(
    private readonly telemetryClient: TelemetryClient,
    private readonly eventNamePrefix: string,
    options?: Transport.TransportStreamOptions
  ) {
    super(options);
    this.level = options?.level ?? "info";
  }

  public log(
    { level, name, ...properties }: winston.LogEntry,
    callback: (err: Error | undefined, cont: boolean) => void
  ): void {
    if (!this.silent) {
      this.telemetryClient.trackEvent({
        name: `${this.eventNamePrefix}.${level}.${
          name ?? "global"
        }`.toLowerCase(),
        // Warning: this entries operations is needed becouse winston add three Symbol properties to meta object given to log method: we want to strip this additional properties
        // https://github.com/winstonjs/winston/tree/v3.8.2#streams-objectmode-and-info-objects
        properties: Object.entries(properties).reduce(
          (acc, [k, v]) => (typeof k === "symbol" ? acc : { ...acc, [k]: v }),
          {} as Record<string, unknown>
        ),
        tagOverrides: { samplingEnabled: "false" },
      });
    }
    callback(undefined, true);
  }
}

export const withApplicationInsight = (
  telemetryClient: TelemetryClient,
  eventNamePrefix: string
): winston.transport =>
  new ApplicationInsightTransport(telemetryClient, eventNamePrefix);

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

export const makeAppInsightsLogger = (
  instrumentationKey: string,
  config: LogConfig
) =>
  pipe(
    initAppInsights(instrumentationKey, {
      disableAppInsights: process.env.APPINSIGHTS_DISABLED === "true",
      samplingPercentage: process.env.APPINSIGHTS_SAMPLING_PERCENTAGE
        ? parseInt(process.env.APPINSIGHTS_SAMPLING_PERCENTAGE, 10)
        : 5,
    }),
    (telemetryClient) =>
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
        transports: [
          withApplicationInsight(telemetryClient, "io-openid-provider"),
        ],
      })
  );

export const makeLogger = (config: LogConfig) =>
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
