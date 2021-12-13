import * as pc from "prom-client";
import { Logger } from "@pagopa/cloudgaap-commons-ts/lib/logger";

interface MetricService {
  readonly getMetrics: () => Promise<string>;
}

const getPrometheusMetrics = (): Promise<string> => pc.register.metrics();

const idempotentCollectDefaultMetrics = (logger: Logger): void => {
  try {
    pc.collectDefaultMetrics();
  } catch {
    logger.error("collectDefaultMetrics called more than one times.");
  }
};

const makeMetricService = (logger: Logger): MetricService => {
  idempotentCollectDefaultMetrics(logger);
  return {
    getMetrics: getPrometheusMetrics,
  };
};

export { MetricService, makeMetricService };
