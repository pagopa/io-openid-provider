import express from "express";
import * as PR from "io-ts/PathReporter";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import { Task } from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import * as oidc from "oidc-provider";
import { flow, pipe } from "fp-ts/lib/function";
import { Logger } from "../logger";
import { GrantRepository } from "../core/repositories/GrantRepository";
import { AccountId, ClientId, Grant, GrantId } from "../core/domain";
import {
  CustomInteraction,
  CustomInteractionResult,
  ErrorType,
  makeCustomInteractionError,
} from "./domain";

// Given a t.Errors return an Error
const errorsToError = flow(
  PR.failure,
  (errors) => new Error(errors.join("\n"))
);

// This is just a utility method that logs if any errors occur from f
const tryCatchWithLogTE = <A>(f: Task<A>, logger: Logger) =>
  pipe(
    TE.tryCatch(f, E.toError),
    TE.mapLeft((error) => {
      logger.error("Error on tryCatchWithLogTE", error);
      return makeCustomInteractionError(ErrorType.internalError);
    })
  );

// Given a request retrieve and return an Interaction
const getInteraction =
  (provider: oidc.Provider, logger: Logger) =>
  (req: express.Request, res: express.Response) =>
    pipe(
      TE.tryCatch(() => provider.interactionDetails(req, res), E.toError),
      TE.chainFirst((interaction) =>
        TE.of(
          logger.info(`getInteraction ${JSON.stringify(interaction, null, 2)}`)
        )
      ),
      TE.chain(
        flow(CustomInteraction.decode, TE.fromEither, TE.mapLeft(errorsToError))
      ),
      TE.orElseFirst((error) =>
        TE.of(logger.error("getInteraction decode error", error))
      ),
      TE.mapLeft((_) => makeCustomInteractionError(ErrorType.internalError))
    );

// Finish an interaction given a Result. Finish an interaction could end
// with a send response.
const finishInteraction =
  (provider: oidc.Provider, logger: Logger) =>
  (
    req: express.Request,
    res: express.Response,
    result: CustomInteractionResult,
    merge: boolean = false
  ) =>
    pipe(
      tryCatchWithLogTE(
        () =>
          provider.interactionFinished(req, res, result, {
            mergeWithLastSubmission: merge,
          }),
        logger
      ),
      TE.orElseFirst((error) =>
        TE.of(logger.error("finishInteraction error", error))
      ),
      TE.mapLeft((_) => makeCustomInteractionError(ErrorType.internalError))
    );

// Create a Grant given an Interaction
const createGrant =
  (provider: oidc.Provider, grantRepository: GrantRepository, logger: Logger) =>
  (
    interaction: CustomInteraction,
    rememberGrantForNextRequests: boolean
  ): T.Task<CustomInteractionResult> => {
    // create the grant and add the missing scope if any
    const maybeGrant = pipe(
      O.fromNullable(interaction.session),
      O.map((session) => {
        const newGrant = new provider.Grant({
          accountId: session.accountId,
          clientId: interaction.params.client_id,
        });
        const missingScope = interaction.prompt.details.missingOIDCScope || [];
        newGrant.addOIDCScope(missingScope.join(" "));
        // eslint-disable-next-line functional/immutable-data
        newGrant.jti = interaction.grantId || newGrant.jti;
        const newDomainGrant: Grant = {
          accountId: session.accountId as AccountId,
          clientId: interaction.params.client_id as ClientId,
          expireAt: new Date(),
          id: (interaction.grantId || newGrant.jti) as GrantId,
          issuedAt: new Date(),
          remember: rememberGrantForNextRequests,
          scope: newGrant.openid?.scope || "",
        };
        return { domainGrant: newDomainGrant, oidcGrant: newGrant };
      })
    );
    // Persist and return the grant
    return pipe(
      TE.fromOption(() => makeCustomInteractionError(ErrorType.accessDenied))(
        maybeGrant
      ),
      TE.chainFirst(({ domainGrant }) =>
        pipe(
          grantRepository.upsert(domainGrant),
          TE.mapLeft((_) => ({ error: ErrorType.internalError }))
        )
      ),
      TE.chain(({ oidcGrant }) =>
        tryCatchWithLogTE(() => oidcGrant.save(), logger)
      ),
      TE.bimap(
        (_) => makeCustomInteractionError(ErrorType.internalError),
        (grantId) => ({
          consent: {
            grantId,
          },
        })
      ),
      TE.toUnion
    );
  };

const getClient =
  (provider: oidc.Provider, logger: Logger) => (clientId: string) =>
    pipe(
      tryCatchWithLogTE(() => provider.Client.find(clientId), logger),
      // transform the error into an internal_error
      TE.mapLeft((error) => {
        logger.error("getClient error", error);
        return makeCustomInteractionError(ErrorType.internalError);
      }),
      // transform the undefined into an invalid_client
      TE.chain(
        flow(
          O.fromNullable,
          TE.fromOption(() =>
            makeCustomInteractionError(ErrorType.invalidClient)
          )
        )
      )
    );

/**
 * Simplifies the interaction with the Provider of oidc-provider library.
 * The aim of this service is to wrap the functions of the provider into functional structures.
 */
type ProviderService = ReturnType<typeof makeService>;

/**
 * Create a ProviderService.
 *
 * @param provider The provider to use.
 * @param logger An instance of the Logger.
 * @returns An instance of ProviderService.
 */
const makeService = (
  provider: oidc.Provider,
  grantRepository: GrantRepository,
  logger: Logger
) => ({
  /**
   * Create and persist a Grant given an interaction.
   *
   * @param interaction: Given a CustomInteraction return a CustomInteractionResult
   */
  createGrant: createGrant(provider, grantRepository, logger),

  /**
   * Finish an interaction with the given result.
   *
   * @param req: The express Request from which retrieve interaction.
   * @param res: The express Response where write the result.
   * @param result: The result to finish the interaction.
   * @param merge: If true the previous result (if any) is merged into this one.
   */
  finishInteraction: finishInteraction(provider, logger),

  /**
   * Return the client.
   *
   * @param clientId: The client identifier.
   */
  getClient: getClient(provider, logger),

  /**
   * Try to retrieve an CustomInteraction from the request.
   *
   * @param req: The express Request from which retrieve interaction.
   * @param res: The express Response (the oidc-provider require also the response).
   * @returns A TaskEither with an error or the CustomInteraction.
   */
  getInteraction: getInteraction(provider, logger),
});

export { ErrorType, ProviderService, makeService };
