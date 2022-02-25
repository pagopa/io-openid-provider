import express from "express";
import { pipe } from "fp-ts/lib/function";
import * as T from "fp-ts/Task";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { FederationToken, IdentityService } from "../identities/service";
import { Logger } from "../logger";
import { ErrorType, ProviderService } from "./service";
import { makeCustomInteractionError } from "./domain";

const confirmPostHandler =
  (providerService: ProviderService): express.Handler =>
  (req, res, next) =>
    pipe(
      // retrieve the interaction from request
      providerService.getInteraction(req, res),
      // create the grant given the interaction
      TE.chain((interaction) =>
        TE.fromTask(providerService.createGrant(interaction))
      ),
      // both left and right are InteractionResult
      TE.toUnion,
      // finish the interaction
      T.chain((result) =>
        providerService.finishInteraction(req, res, result, true)
      ),
      // the finishInteraction can end in an error,
      // in this case call next
      TE.mapLeft((_error) => next())
    )();

const interactionGetHandler =
  (
    federationTokenKey: string,
    providerService: ProviderService,
    identityService: IdentityService,
    _logger: Logger
  ): express.Handler =>
  (req, res, next) =>
    pipe(
      providerService.getInteraction(req, res),
      TE.chain((interaction) => {
        switch (interaction.prompt.name) {
          case "login":
            return pipe(
              // extract the token
              req.cookies[federationTokenKey],
              FederationToken.decode,
              E.mapLeft((_errors) =>
                makeCustomInteractionError(ErrorType.accessDenied)
              ),
              TE.fromEither,
              TE.orElseFirst((_) => TE.of(_logger.error(JSON.stringify(_)))),
              TE.chainFirst((_) => TE.of(_logger.error(JSON.stringify(_)))),
              // given the token validate it, then returns the
              // identity AND the federation token, because
              // we use it to identify the user in the next steps
              TE.chain((federationToken) =>
                pipe(
                  identityService.authenticate(federationToken),
                  TE.bimap(
                    (_error) =>
                      makeCustomInteractionError(ErrorType.accessDenied),
                    (identity) => ({ federationToken, identity })
                  )
                )
              ),
              TE.fold(
                (error) => providerService.finishInteraction(req, res, error),
                ({ federationToken }) =>
                  providerService.finishInteraction(req, res, {
                    // we can't use the tax code as accountId because we
                    // can't use it to retrieve the user information in the consent phase.
                    login: { accountId: federationToken },
                  })
              )
            );
          case "consent":
            return pipe(
              // retrieve the client from database
              providerService.getClient(interaction.params.client_id),
              // if the client has the bypass_consent property set to true
              // don't render the consent page, just confirm the interaction
              TE.chain((client) => {
                if (client.bypass_consent) {
                  return TE.of(
                    confirmPostHandler(providerService)(req, res, next)
                  );
                } else {
                  // render the interaction view
                  return TE.fromEither(
                    E.tryCatch(
                      () =>
                        res.render("interaction", {
                          p_client: client,
                          p_details: interaction.prompt.details,
                          p_params: interaction.params,
                          p_submitUrl: `/interaction/${interaction.uid}/confirm`,
                          p_uid: interaction.uid,
                        }),
                      (_) => makeCustomInteractionError(ErrorType.internalError)
                    )
                  );
                }
              }),
              TE.orElse((_error) =>
                providerService.finishInteraction(
                  req,
                  res,
                  makeCustomInteractionError(ErrorType.internalError)
                )
              )
            );
          default:
            return providerService.finishInteraction(
              req,
              res,
              makeCustomInteractionError(ErrorType.internalError)
            );
        }
      }),
      TE.mapLeft((_error) => next())
    )();

/* Returns the router that handle interactions */
const makeRouter = (
  providerService: ProviderService,
  identityService: IdentityService,
  logger: Logger
): express.Router => {
  const router = express.Router();

  router.get(
    "/interaction/:uid",
    interactionGetHandler(
      "X-IO-Federation-Token",
      providerService,
      identityService,
      logger
    )
  );

  router.post("/interaction/:uid/confirm", confirmPostHandler(providerService));

  return router;
};

export { makeRouter };
