/**
 * This module contains all the endpoint related
 * to the OpenID Connect protocol
 */
import express from "express";
import * as oidc from "oidc-provider";
import { pipe } from "fp-ts/lib/function.js";
import * as E from "fp-ts/lib/Either.js";
import * as T from "fp-ts/lib/Task.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import Provider from "oidc-provider";
import {
  ProcessInteractionUseCase,
  CollectConsent,
} from "../../../../useCases/ProcessInteractionUseCase.js";
import { Config } from "../../../../config.js";
import { InteractionId } from "../../../../domain/interactions/types.js";
import { ConfirmConsentUseCase } from "../../../../useCases/ConfirmConsentUseCase.js";
import { AbortInteractionUseCase } from "../../../../useCases/AbortInteractionUseCase.js";
import { formatError } from "../../../../domain/types/index.js";
import { grantToAdapterPayload } from "./adapters/grantAdapter.js";

const interactionFinishedTE = (
  provider: Provider,
  req: express.Request,
  res: express.Response,
  result: oidc.InteractionResults & { readonly error?: string }
) =>
  TE.tryCatch(() => provider.interactionFinished(req, res, result), E.toError);

const renderConsent = (res: express.Response, renderData: CollectConsent) =>
  E.tryCatch(
    () =>
      res.render("interaction", {
        p_abortUrl: `/interaction/${renderData.interactionId}/abort`,
        p_client: renderData.client,
        p_missingScope: renderData.missingScope,
        p_showRememberMeFeature: renderData.allowRemembering,
        p_submitUrl: `/interaction/${renderData.interactionId}/confirm`,
      }),
    E.toError
  );

const getInteractionHandler =
  (
    config: Config,
    processInteractionUseCase: ProcessInteractionUseCase,
    provider: Provider
  ): express.Handler =>
  (req, res, next) => {
    const response = pipe(
      // decode the interaction
      TE.fromEither(
        pipe(
          InteractionId.decode(req.params.id),
          E.mapLeft(() => formatError)
        )
      ),
      TE.chain((interactionId) =>
        // process the interaction
        processInteractionUseCase(
          interactionId,
          () => req.cookies[config.server.authenticationCookieKey]
        )
      ),
      // render the result
      TE.fold(
        (error) => {
          return interactionFinishedTE(provider, req, res, {
            error: error.kind,
          });
        },
        (result) => {
          switch (result.kind) {
            case "LoginResult":
              return interactionFinishedTE(provider, req, res, {
                login: { accountId: result.identity.id },
              });
            case "ConsentResult":
              return interactionFinishedTE(provider, req, res, {
                consent: {
                  grantId: grantToAdapterPayload(result.grant).jti,
                },
              });
            case "CollectConsent":
              return TE.fromEither(renderConsent(res, result));
            default:
              return interactionFinishedTE(provider, req, res, {
                error: "Invalid Step",
              });
          }
        }
      ),
      // the finishInteraction can terminate in error,
      // in this case call next
      TE.mapLeft(() => {
        next();
      })
    );
    return response();
  };

const postInteractionHandler =
  (
    confirmConsentUseCase: ConfirmConsentUseCase,
    provider: Provider
  ): express.Handler =>
  (req, res, next) => {
    const response = pipe(
      // decode the interaction
      TE.fromEither(
        pipe(
          InteractionId.decode(req.params.id),
          E.mapLeft(() => formatError)
        )
      ),
      // run the logic to confirm the consent
      TE.chain((interactionId) =>
        confirmConsentUseCase(interactionId, req.body.to_remember === "on")
      ),
      // create the result
      TE.bimap(
        (error) => ({ error: error.kind }),
        (grant) => ({
          consent: { grantId: grantToAdapterPayload(grant).jti },
        })
      ),
      // both left and right are InteractionResult
      TE.toUnion,
      // send the result
      T.chain((result) => interactionFinishedTE(provider, req, res, result)),
      // on any strange error call next
      TE.mapLeft(() => next())
    );
    return response();
  };

const getInteractionAbortHandler =
  (
    abortInteractionUseCase: AbortInteractionUseCase,
    provider: Provider
  ): express.Handler =>
  (req, res, next) =>
    pipe(
      // decode the interaction
      TE.fromEither(
        pipe(
          InteractionId.decode(req.params.id),
          E.mapLeft(() => formatError)
        )
      ),
      // run the abort interaction logic
      TE.chainW(abortInteractionUseCase),
      // create the result
      TE.bimap(
        (errMsg) => ({
          error: errMsg.kind,
        }),
        () => ({
          error: "access denied",
          error_description: "End-User aborted interaction",
        })
      ),
      // both left and right are InteractionResult
      TE.toUnion,
      // finish the interaction
      T.chain((result) => interactionFinishedTE(provider, req, res, result)),
      // the finishInteraction can terminate in error,
      // in this case call next
      TE.mapLeft(() => next())
    )();

/**
 * Create and return a Router that manage all OpenID Connect endpoints
 */
export const makeInteractionRouter = (
  config: Config,
  processInteractionUseCase: ProcessInteractionUseCase,
  confirmConsentUseCase: ConfirmConsentUseCase,
  abortInteractionUseCase: AbortInteractionUseCase,
  provider: Provider
): express.Router => {
  const router = express.Router();

  router.get(
    "/interaction/:id",
    getInteractionHandler(config, processInteractionUseCase, provider)
  );

  router.post(
    "/interaction/:id/confirm",
    postInteractionHandler(confirmConsentUseCase, provider)
  );

  router.get(
    "/interaction/:id/abort",
    getInteractionAbortHandler(abortInteractionUseCase, provider)
  );

  return router;
};
