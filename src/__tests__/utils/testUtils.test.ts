import {Application, makeApplication} from "../../application";
import {Logger, makeLogger} from "@pagopa/cloudgaap-commons-ts/lib/logger";
import {makeMetricService, MetricService} from "../../metrics/metricService";
import {Config} from "../../config";

const testConfig: Config = {
    logger: { logLevel: "trace", logName: "application.test" },
    server: { hostname: "hostname", port: 1234 },
};

const makeTestApplication = (): Application => {
    const logger: Logger = makeLogger({logLevel: "debug", logName: "application.test"});
    const metricService: MetricService = makeMetricService(logger);
    return makeApplication(testConfig, metricService, logger);
}

export { makeTestApplication }
