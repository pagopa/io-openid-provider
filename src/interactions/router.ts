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
import * as s from "./service";
import * as p from "./providerAdapters";

// TODO: Move to environment
const cookieKey = "X-IO-Federation-Token";
const extractIOFederationToken = (req: express.Request): O.Option<string> =>
  f.pipe(req.cookies[cookieKey], strings.NonEmptyString.decode, O.fromEither);

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

const confirmFun =
  (provider: oidc.Provider) =>
  (req: express.Request) =>
  (res: express.Response) =>
    f.pipe(
      p.getInteractionDetail(provider)(req)(res),
      TE.chainTaskK(s.confirm(provider)),
      TE.chain(p.finishInteraction(provider)(req)(res)(true))
    );

const confirmPostHandler =
  (provider: oidc.Provider): express.Handler =>
  (req, res, next) =>
    f.pipe(
      confirmFun(provider)(req)(res),
      TE.bimap(
        (_) => next(),
        (_) => next()
      )
    )();

const interactionFun =
  (provider: oidc.Provider) =>
  (userInfoClient: u.UserInfoClient) =>
  (logger: l.Logger) =>
  (req: express.Request) =>
  (res: express.Response) =>
  ({ uid, prompt, params }: s.ConsumeInput) => {
    switch (prompt.name) {
      case "login":
        return f.pipe(
          // extract the token from request
          extractIOFederationToken(req),
          // if not found respond with unauthorized
          TE.fromOption(f.constant(p.unauthorizedInteractionResult)),
          // find the user given the token
          TE.fold(
            (left) => T.of(left),
            (right) => s.authenticate(userInfoClient)(right)
          ),
          T.chain(p.finishInteraction(provider)(req)(res)(false))
        );
      case "consent":
        return f.pipe(
          // TODO: remove this cast
          p.getClient(provider)(params.client_id as string),
          TE.chain((client) => {
            if (client.bypass_consent) {
              return confirmFun(provider)(req)(res);
            } else {
              return renderConsent(uid)(params)(prompt)(client)(res);
            }
          })
        );
      default:
        return f.pipe(
          T.of({ error: "invalid_request" }),
          T.chainFirst((_) => T.of(logger.info(`Unknown input: ${_}`))),
          T.chain(p.finishInteraction(provider)(req)(res)(false))
        );
    }
  };

const interactionGetHandler =
  (provider: oidc.Provider) =>
  (userInfoClient: u.UserInfoClient) =>
  (logger: l.Logger): express.Handler =>
  (req, res, next) =>
    f.pipe(
      p.getInteractionDetail(provider)(req)(res),
      TE.chain(interactionFun(provider)(userInfoClient)(logger)(req)(res)),
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

export { makeRouter };
