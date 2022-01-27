import * as http from "http";
import * as E from "fp-ts/Either";
import * as D from "io-ts/Decoder";
import { Application } from "express";
import { pipe } from "fp-ts/function";
import { makeApplication } from "./application";
import * as c from "./config";
import * as logger from "./logger";
import * as userinfo from "./userinfo/ioUserInfoClient";

const start = (application: Application, log: logger.Logger): void => {
  log.info("Starting application");
  const server = http.createServer(application);
  const port = application.get("port");
  server.listen(port, application.get("hostname"), () => {
    log.info(`Server is listening on port ${port}`);
  });
};

const exit = (parseError: D.DecodeError): void => {
  const log = logger.makeLogger({ logLevel: "error", logName: "main" });
  log.error(`Shutting down application ${D.draw(parseError)}`);
  process.exit(1);
};

// TODO: add graceful shutdown

const main = pipe(
  E.Do,
  E.bind("conf", () => c.parseConfig(process.env)),
  E.bind("log", ({ conf }) => E.right(logger.makeLogger(conf.logger))),
  E.bind("client", ({ conf }) =>
    E.right(userinfo.makeIOBackendClient(conf.IOBackend.baseURL.href))
  ),
  E.bind("userInfoClient", ({ client }) =>
    E.right(userinfo.makeIOUserInfoClient(client))
  ),
  E.bind("app", ({ conf, log, userInfoClient }) =>
    E.right(
      makeApplication(
        conf,
        userInfoClient,
        logger.makeSubLogger(log, "application")
      )
    )
  ),
  E.map(({ app, log }) => start(app, log))
);

E.getOrElse(exit)(main);
