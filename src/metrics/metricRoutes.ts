import * as e from "express";
import * as enc from "@pagopa/cloudgaap-commons-ts/lib/encoders/httpEncoders";
import { handleResponse } from "../handlerUtils";
import { MetricService } from "./metricService";
import { encode } from "./codec";

const handleGetMetrics =
  (metricService: MetricService) =>
  (_req: e.Request, res: e.Response): void => {
    handleResponse(
      res,
      () => metricService.getMetrics(),
      enc.responseOk(enc.encodeString(encode))
    );
  };

/* Handle the endpoints about metrics */
const metricRoutes = (metricService: MetricService): e.Router => {
  const router = e.Router();

  router.get("/metrics", handleGetMetrics(metricService));

  return router;
};

export { metricRoutes };
