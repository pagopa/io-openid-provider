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
import { Config } from "../../../../config";
import { Logger } from "../../../../domain/logger";
import { InteractionService } from "../../../../domain/interactions/InteractionService";
import {
  InteractionId,
  interactionStep,
} from "../../../../domain/interactions/types";
import { IdentityService } from "../../../../domain/identities/IdentityService";
import { AuthenticateUseCase } from "../../../../domain/useCases/AuthenticateUseCase";
import {
  ProcessConsentUseCase,
  RenderData,
} from "../../../../domain/useCases/ProcessConsentUseCase";
import { ConfirmConsentUseCase } from "../../../../domain/useCases/ConfirmConsentUseCase";
import { show } from "../../../../domain/utils";

const makeInteractionError = (msg: string): oidc.InteractionResults => ({
  error: msg,
});

const internalError = {
  error: "Internal Error",
};

const getInteraction =
  (logger: Logger, interactionService: InteractionService) =>
  (req: express.Request) =>
    pipe(
      E.of(interactionService.find),
      E.ap(InteractionId.decode(req.params.id)),
      E.bimap(
        (_) => TE.left(internalError),
        (res) =>
          pipe(
            res,
            TE.mapLeft((_) => internalError),
            TE.chain(TE.fromOption(() => internalError))
          )
      ),
      E.fold(
        (_) => TE.left(internalError),
        (result) => result
      ),
      TE.chainFirst((result) =>
        TE.of(logger.info(`getInteraction: ${show(result)}`))
      )
    );

const finishInteraction =
  (provider: oidc.Provider) =>
  (
    req: express.Request,
    res: express.Response,
    result: oidc.InteractionResults
  ) =>
    TE.tryCatch(
      () =>
        provider.interactionFinished(req, res, result, {
          mergeWithLastSubmission: true,
        }),
      E.toError
    );

const tryCatch = <T>(fn: () => Promise<T>) => pipe(TE.tryCatch(fn, E.toError));

const renderConsent = (res: express.Response, renderData: RenderData) =>
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
      getInteraction(logger, interactionService)(req),
      TE.fold(
        () => TE.fromEither(E.tryCatch(() => next(), E.toError)),
        (interaction) => {
          if (interactionStep(interaction) === "login") {
            return pipe(
              // run the logic to handle the login
              AuthenticateUseCase(
                logger,
                identityService
              )(req.cookies[config.server.authenticationCookieKey]),
              // create the result
              TE.bimap(
                (errorMessage) => ({ error: errorMessage }),
                (identityId) => ({ login: { accountId: identityId.id } })
              ),
              // Left and Right has an InteractionResult
              TE.toUnion,
              // send the result
              T.chain((result) =>
                tryCatch(() => provider.interactionFinished(req, res, result))
              )
            );
          } else {
            return pipe(
              // run the logic to handle the consent
              ProcessConsentUseCase(
                logger,
                clientService,
                grantService
              )(interaction),
              // create the result
              TE.fold(
                (errorMessage) => TE.right(makeInteractionError(errorMessage)),
                E.fold(
                  (renderData) => TE.left(renderData),
                  (grant) => TE.right({ consent: { grantId: grant.id } })
                )
              ),
              // send the result
              TE.fold(
                (renderData) => TE.fromEither(renderConsent(res, renderData)),
                (result) =>
                  pipe(
                    finishInteraction(provider)(req, res, result),
                    TE.chainFirst((_) =>
                      TE.of(logger.info(`interactionFinished: ${show(result)}`))
                    ),
                    TE.orElseFirst((_) =>
                      TE.of(
                        logger.info(
                          `interactionFinished error: ${show(result)}`
                        )
                      )
                    )
                  )
              )
            );
          }
        }
      )
    );
    return response();
  };

const postInteractionHandler =
  (
    logger: Logger,
    interactionService: InteractionService,
    grantService: GrantService,
    provider: oidc.Provider
  ): express.Handler =>
  (req, res, next) => {
    const response = pipe(
      // run the logic to confirm the consent
      ConfirmConsentUseCase(
        logger,
        interactionService,
        grantService
      )(req.params.id, req.body.to_remember === "on"),
      // create the result
      TE.bimap(
        (errorMessage) => ({ error: errorMessage }),
        (grantId) => ({ consent: { grantId } })
      ),
      // Left and Right has an InteractionResult
      TE.toUnion,
      // send the result
      T.chain((result) => finishInteraction(provider)(req, res, result)),
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
      // retrieve the interaction from request
      getInteraction(logger, interactionService)(req),
      // create the abort result
      TE.map((_interaction) => ({
        error: "access denied",
        error_description: "End-User aborted interaction",
      })),
      // both left and right are InteractionResult
      TE.toUnion,
      // finish the interaction
      T.chain((result) =>
        tryCatch(() => provider.interactionFinished(req, res, result))
      ),
      // the finishInteraction can end in an error,
      // in this case call next
      TE.mapLeft((_error) => next())
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
    postInteractionHandler(logger, interactionService, grantService, provider)
  );

  router.get(
    "/interaction/:id/abort",
    getInteractionAbortHandler(logger, interactionService, provider)
  );

  return router;
};
