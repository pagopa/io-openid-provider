import * as express from "express";
import * as oidc from "oidc-provider";
import * as f from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as u from "../userinfo";

const makeInteractionResult = (
  id: u.FederationToken
): oidc.InteractionResults => ({
  login: {
    accountId: id,
  },
});

const unauthorizedInteractionResult: oidc.InteractionResults = {
  error: "unauthorized",
};

const getInteractionDetail =
  (provider: oidc.Provider) =>
  (req: express.Request) =>
  (res: express.Response) =>
    TE.tryCatch(() => provider.interactionDetails(req, res), E.toError);

const finishInteraction =
  (provider: oidc.Provider) =>
  (req: express.Request) =>
  (res: express.Response) =>
  (mergeWithLastSubmission: boolean) =>
  (result: oidc.InteractionResults) =>
    TE.tryCatch(
      () =>
        provider.interactionFinished(req, res, result, {
          mergeWithLastSubmission,
        }),
      E.toError
    );

const getClient = (provider: oidc.Provider) => (clientId: string) =>
  f.pipe(
    TE.tryCatch(() => provider.Client.find(clientId), E.toError),
    TE.map(O.fromNullable),
    TE.chain(TE.fromOption(f.constant(new Error("Client not found"))))
  );

export {
  unauthorizedInteractionResult,
  makeInteractionResult,
  getInteractionDetail,
  finishInteraction,
  getClient,
};
