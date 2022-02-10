import * as express from "express";
import * as oidc from "oidc-provider";
import * as f from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import * as strings from "@pagopa/ts-commons/lib/strings";
import * as u from "../userinfo";
import * as l from "../logger";

// TODO: Move to environment
const cookieKey = "X-IO-Federation-Token";
const extractIOFederationToken = (req: express.Request): O.Option<string> =>
  f.pipe(req.cookies[cookieKey], strings.NonEmptyString.decode, O.fromEither);

const unauthorizedInteractionResult: oidc.InteractionResults = {
  error: "unauthorized",
};

const makeInteractionResult = (
  id: u.FederationToken
): oidc.InteractionResults => ({
  login: {
    accountId: id,
  },
});

const getInteractionDetail =
  (provider: oidc.Provider) =>
  (req: express.Request) =>
  (res: express.Response) =>
    TE.tryCatch(() => provider.interactionDetails(req, res), E.toError);

const finishInteraction =
  (provider: oidc.Provider) =>
  (req: express.Request) =>
  (res: express.Response) =>
  (result: oidc.InteractionResults) =>
    TE.tryCatch(
      () => provider.interactionFinished(req, res, result),
      E.toError
    );

const authenticate =
  (userInfoClient: u.UserInfoClient) => (req: express.Request) =>
    f.pipe(
      // extract the token from request
      extractIOFederationToken(req),
      // if not found reply with unauthorized
      TE.fromOption(f.constant(unauthorizedInteractionResult)),
      // find the user given the token
      TE.chain((token) =>
        f.pipe(
          userInfoClient.findUserByFederationToken(token),
          TE.bimap(
            (_) => unauthorizedInteractionResult,
            (_) => makeInteractionResult(token)
          )
        )
      ),
      TE.toUnion
    );

interface ConsumeInput {
  readonly prompt: oidc.PromptDetail;
}

const consumeInteraction =
  (provider: oidc.Provider) =>
  (userInfoClient: u.UserInfoClient) =>
  (logger: l.Logger) =>
  (req: express.Request) =>
  (res: express.Response) =>
  ({ prompt }: ConsumeInput): TE.TaskEither<Error, void> => {
    switch (prompt.name) {
      case "login":
        return f.pipe(
          authenticate(userInfoClient)(req),
          T.chain(finishInteraction(provider)(req)(res))
        );
      case "consent":
        return f.pipe(TE.of(logger.info("consent")), TE.map(f.constVoid));
      default:
        return f.pipe(TE.of(logger.info(prompt.name)), TE.map(f.constVoid));
    }
  };

const getInteractionHandler =
  (provider: oidc.Provider) =>
  (userInfoClient: u.UserInfoClient) =>
  (logger: l.Logger): express.Handler =>
  (req, res, next) =>
    f.pipe(
      getInteractionDetail(provider)(req)(res),
      TE.chainW(consumeInteraction(provider)(userInfoClient)(logger)(req)(res)),
      TE.bimap(
        (_) => next(),
        (_) => next()
      )
    )();

/* Returns the router that provide routes for interaction */
const makeRouter =
  (provider: oidc.Provider) =>
  (userInfoClient: u.UserInfoClient) =>
  (logger: l.Logger): express.Router => {
    const router = express.Router();

    router.get(
      "/interaction/:uid",
      getInteractionHandler(provider)(userInfoClient)(logger)
    );

    // router.post("/interaction/:uid/consent", postConsentHandler(provider)(logger))

    return router;
  };

export { makeRouter, authenticate };
