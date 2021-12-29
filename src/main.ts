import * as http from "http";
import * as e from "fp-ts/Either";
import * as d from "io-ts/Decoder";
import { Application } from "express";
import { pipe } from "fp-ts/function";
import { makeApplication } from "./application";
import * as c from "./config";
import * as logger from "./logger";
import * as userinfo from "./userinfo/fakeuserinfoclient";

const start = (application: Application, log: logger.Logger): void => {
  log.info("Starting application");
  const server = http.createServer(application);
  const port = application.get("port");
  server.listen(port, application.get("hostname"), () => {
    log.info(`Server is listening on port ${port}`);
  });
};

const exit = (parseError: d.DecodeError): void => {
  const log = logger.makeLogger({ logLevel: "error", logName: "main" });
  log.error(`Shutting down application ${d.draw(parseError)}`);
  process.exit(1);
};

// TODO: add graceful shutdown

const main = pipe(
  e.Do,
  e.bind("conf", () => c.parseConfig(process.env)),
  e.bind("log", ({ conf }) => e.right(logger.makeLogger(conf.logger))),
  e.bind("userInfoClient", () => e.right(userinfo.makeConstUserInfoClient())),
  e.bind("app", ({ conf, log, userInfoClient }) =>
    e.right(
      makeApplication(
        conf,
        userInfoClient,
        logger.makeSubLogger(log, "application")
      )
    )
  ),
  e.map(({ app, log }) => start(app, log))
);

e.getOrElse(exit)(main);
