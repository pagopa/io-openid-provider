/**
 * This module contains all the endpoint related
 * to the OpenID Connect protocol
 */
import express from "express";
import * as oidc from "oidc-provider";
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import { ClientService } from "src/domain/clients/ClientService";
import { GrantService } from "src/domain/grants/GrantService";
import {
  ProcessInteractionUseCase,
  ProcessInteractionUseCaseError,
  RequireConsent,
} from "../../../../domain/useCases/ProcessInteractionUseCase";
import { Config } from "../../../../config";
import { Logger } from "../../../../domain/logger";
import { InteractionService } from "../../../../domain/interactions/InteractionService";
import { InteractionId } from "../../../../domain/interactions/types";
import { IdentityService } from "../../../../domain/identities/IdentityService";
import { ConfirmConsentUseCase } from "../../../../domain/useCases/ConfirmConsentUseCase";
import { AbortInteractionUseCase } from "../../../../domain/useCases/AbortInteractionUseCase";

const renderConsent = (res: express.Response, renderData: RequireConsent) =>
  E.tryCatch(
    () =>
      res.render("interaction", {
        p_abortUrl: `/interaction/${renderData.interactionId}/abort`,
        p_client: renderData.client,
        p_missingScope: renderData.missingScope,
        p_submitUrl: `/interaction/${renderData.interactionId}/confirm`,
      }),
    E.toError
  );

const getInteractionHandler =
  (
    config: Config,
    logger: Logger,
    identityService: IdentityService,
    interactionService: InteractionService,
    clientService: ClientService,
    grantService: GrantService,
    provider: oidc.Provider
    // eslint-disable-next-line max-params
  ): express.Handler =>
  (req, res, next) => {
    const response = pipe(
      // decode the interaction
      TE.fromEither(
        pipe(
          InteractionId.decode(req.params.id),
          E.mapLeft((_) => ProcessInteractionUseCaseError.invalidInteraction)
        )
      ),
      TE.chain((interactionId) =>
        // process the interaction
        ProcessInteractionUseCase(
          logger,
          identityService,
          interactionService,
          clientService,
          grantService
        )(
          interactionId,
          () => req.cookies[config.server.authenticationCookieKey]
        )
      ),
      // render the result
      TE.fold(
        (errorMessage) =>
          TE.tryCatch(
            () =>
              provider.interactionFinished(req, res, { error: errorMessage }),
            E.toError
          ),
        (result) => {
          switch (result.kind) {
            case "LoginResult":
              return TE.tryCatch(
                () =>
                  provider.interactionFinished(req, res, {
                    login: { accountId: result.identity.id },
                  }),
                E.toError
              );
            case "ConsentResult":
              return TE.tryCatch(
                () =>
                  provider.interactionFinished(req, res, {
                    consent: { grantId: result.grant.id },
                  }),
                E.toError
              );
            case "RequireConsent":
              return TE.fromEither(renderConsent(res, result));
            default:
              return TE.tryCatch(
                () =>
                  provider.interactionFinished(req, res, {
                    error: "Invalid Step",
                  }),
                E.toError
              );
          }
        }
      ),
      // the finishInteraction can terminate in error,
      // in this case call next
      TE.mapLeft((_) => next())
    );
    return response();
  };

const postInteractionHandler =
  (
    config: Config,
    logger: Logger,
    interactionService: InteractionService,
    grantService: GrantService,
    provider: oidc.Provider
  ): express.Handler =>
  (req, res, next) => {
    const response = pipe(
      // run the logic to confirm the consent
      ConfirmConsentUseCase(
        config.grantTTL,
        logger,
        interactionService,
        grantService
      )(req.params.id, req.body.to_remember === "on"),
      // create the result
      TE.bimap(
        (errorMessage) => ({ error: errorMessage }),
        (grantId) => ({ consent: { grantId } })
      ),
      // both left and right are InteractionResult
      TE.toUnion,
      // send the result
      T.chain((result) =>
        TE.tryCatch(
          () => provider.interactionFinished(req, res, result),
          E.toError
        )
      ),
      // on any strange error call next
      TE.mapLeft((_) => next())
    );
    return response();
  };

const getInteractionAbortHandler =
  (
    logger: Logger,
    interactionService: InteractionService,
    provider: oidc.Provider
  ): express.Handler =>
  (req, res, next) =>
    pipe(
      // decode the interaction
      TE.fromEither(
        pipe(
          InteractionId.decode(req.params.id),
          E.mapLeft((_) => "Invalid Step")
        )
      ),
      // run the abort interaction logic
      TE.chainW(AbortInteractionUseCase(logger, interactionService)),
      // create the result
      TE.bimap(
        (errMsg) => ({
          error: errMsg,
        }),
        (_) => ({
          error: "access denied",
          error_description: "End-User aborted interaction",
        })
      ),
      // both left and right are InteractionResult
      TE.toUnion,
      // finish the interaction
      T.chain((result) =>
        TE.tryCatch(
          () => provider.interactionFinished(req, res, result),
          E.toError
        )
      ),
      // the finishInteraction can terminate in error,
      // in this case call next
      TE.mapLeft((_) => next())
    )();

/**
 * Create and return a Router that manage all OpenID Connect endpoints
 */
export const makeInteractionRouter = (
  config: Config,
  logger: Logger,
  identityService: IdentityService,
  interactionService: InteractionService,
  clientService: ClientService,
  grantService: GrantService,
  provider: oidc.Provider
  // eslint-disable-next-line max-params
): express.Router => {
  const router = express.Router();

  router.get(
    "/interaction/:id",
    getInteractionHandler(
      config,
      logger,
      identityService,
      interactionService,
      clientService,
      grantService,
      provider
    )
  );

  router.post(
    "/interaction/:id/confirm",
    postInteractionHandler(
      config,
      logger,
      interactionService,
      grantService,
      provider
    )
  );

  router.get(
    "/interaction/:id/abort",
    getInteractionAbortHandler(logger, interactionService, provider)
  );

  return router;
};
