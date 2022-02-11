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
    TE.chain(
      f.flow(
        O.fromNullable,
        TE.fromOption(f.constant(new Error("Client not found")))
      )
    )
  );

const wrapUnsafe = <T>(fun: () => Promise<T>) => TE.tryCatch(fun, E.toError);

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

const renderConsent =
  (uid: string) =>
  (params: oidc.UnknownObject) =>
  (prompt: oidc.PromptDetail) =>
  (client: unknown) =>
  (res: express.Response) =>
    TE.fromEither(
      E.tryCatch(
        () =>
          res.render("interaction", {
            p_client: client,
            p_details: prompt.details,
            p_params: params,
            p_submitUrl: `/interaction/${uid}/confirm`,
            p_uid: uid,
          }),
        E.toError
      )
    );

interface ConsumeInput {
  readonly prompt: oidc.PromptDetail;
  readonly params: oidc.UnknownObject;
  readonly uid: string;
  readonly session?: {
    readonly accountId: string;
  };
}

const interactionFun =
  (provider: oidc.Provider) =>
  (userInfoClient: u.UserInfoClient) =>
  (logger: l.Logger) =>
  (req: express.Request) =>
  (res: express.Response) =>
  ({ uid, prompt, params }: ConsumeInput) => {
    switch (prompt.name) {
      case "login":
        return f.pipe(
          authenticate(userInfoClient)(req),
          T.chain(finishInteraction(provider)(req)(res)(false))
        );
      case "consent":
        return f.pipe(
          // TODO: remove this cast
          getClient(provider)(params.client_id as string),
          TE.chain((client) => renderConsent(uid)(params)(prompt)(client)(res))
        );
      default:
        return f.pipe(TE.of(logger.info(prompt.name)), TE.map(f.constVoid));
    }
  };

const interactionGetHandler =
  (provider: oidc.Provider) =>
  (userInfoClient: u.UserInfoClient) =>
  (logger: l.Logger): express.Handler =>
  (req, res, next) =>
    f.pipe(
      getInteractionDetail(provider)(req)(res),
      TE.chainW(interactionFun(provider)(userInfoClient)(logger)(req)(res)),
      TE.bimap(
        (_) => next(),
        (_) => next()
      )
    )();

const confirm =
  (provider: oidc.Provider) =>
  ({ params, session, prompt }: ConsumeInput) =>
    f.pipe(
      O.fromNullable(session),
      TE.fromOption(f.constant(new Error("no session found"))),
      TE.map(
        (s) =>
          new provider.Grant({
            accountId: s.accountId,
            // TODO: Remove the cast
            clientId: params.client_id as string,
          })
      ),
      TE.map((grant) => {
        // TODO: Remove this cast
        const missingScopes =
          (prompt.details.missingOIDCScope as ReadonlyArray<string>) || [];
        grant.addOIDCScope(missingScopes.join(" "));
        return grant;
      }),
      TE.chain((grant) => wrapUnsafe(() => grant.save())),
      TE.bimap(
        () => unauthorizedInteractionResult,
        (grantId) => ({
          consent: {
            grantId,
          },
        })
      ),
      TE.toUnion
    );

export const confirmPostHandler =
  (provider: oidc.Provider): express.Handler =>
  (req, res, next) =>
    f.pipe(
      getInteractionDetail(provider)(req)(res),
      TE.chain(
        f.flow(
          confirm(provider),
          T.chain(finishInteraction(provider)(req)(res)(true))
        )
      ),
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
      interactionGetHandler(provider)(userInfoClient)(logger)
    );

    router.post("/interaction/:uid/confirm", confirmPostHandler(provider));

    return router;
  };

export { makeRouter, authenticate, confirm };
