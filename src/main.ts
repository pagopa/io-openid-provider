import * as http from "http";
import * as E from "fp-ts/Either";
import { Application } from "express";
import { pipe } from "fp-ts/function";
import { makeApplication } from "./application";
import * as c from "./config";
import * as l from "./logger";
import * as fetch from "./utils/fetch";
import * as userinfo from "./userinfo/ioUserInfoClient";

const start = (application: Application, log: l.Logger): void => {
  log.info("Starting application");
  const server = http.createServer(application);
  const port = application.get("port");
  server.listen(port, application.get("hostname"), () => {
    log.info(`Server is listening on port ${port}`);
  });
};

const exit = (error: string): void => {
  const log = l.makeLogger({ logLevel: "error", logName: "main" });
  log.error(`Shutting down application ${error}`);
  process.exit(1);
};

// TODO: add graceful shutdown
const main = pipe(
  c.parseConfig(process.env),
  E.map((config) => {
    const ioBackendClient = userinfo.makeIOBackendClient(
      config.IOBackend.baseURL,
      fetch.timeoutFetch
    );
    const userInfoClient = userinfo.makeIOUserInfoClient(ioBackendClient);
    const logger = l.makeLogger(config.logger);
    const dbInMemory = false;
    const application = makeApplication(
      config,
      userInfoClient,
      logger,
      dbInMemory
    );
    start(application, logger);
  })
);

E.getOrElse(exit)(main);
