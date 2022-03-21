import * as http from "http";
import * as E from "fp-ts/Either";
import { Application } from "express";
import { pipe } from "fp-ts/function";
import { makeApplication } from "./application";
import * as fetch from "./utils/fetch";
import * as oidcprovider from "./oidcprovider";
import * as interactions from "./interactions/service";
import * as identities from "./identities/service";
import * as clients from "./clients";
import { Logger, makeLogger } from "./logger";
import { parseConfig } from "./config";
import { adapterProvider } from "./oidcprovider/adapters";

const start = (application: Application, log: Logger): void => {
  log.info("Starting application");
  const server = http.createServer(application);
  const port = application.get("port");
  server.listen(port, application.get("hostname"), () => {
    log.info(`Server is listening on port ${port}`);
  });
};

const exit = (error: string): void => {
  const log = makeLogger({ logLevel: "error", logName: "main" });
  log.error(`Shutting down application ${error}`);
  process.exit(1);
};

// TODO: add graceful shutdown
const main = pipe(
  parseConfig(process.env),
  E.map((config) => {
    const logger = makeLogger(config.logger);
    const { ioAuthClient } = clients.makeIOClients(
      config.IOBackend.baseURL,
      fetch.timeoutFetch
    );
    const identityService = identities.makeService(ioAuthClient);
    const providerConfig = oidcprovider.defaultConfiguration(
      adapterProvider(config.redis)
    );
    const provider = oidcprovider.makeProvider(
      config,
      identityService,
      providerConfig
    );
    const providerService = interactions.makeService(provider, logger);
    const application = makeApplication(
      config,
      provider,
      providerService,
      identityService,
      logger
    );
    start(application, logger);
  })
);

E.getOrElse(exit)(main);
