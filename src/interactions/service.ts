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

const tryCatchWithLogTE = <A>(f: Task<A>, logger: Logger) =>
  pipe(
    TE.tryCatch(f, E.toError),
    TE.mapLeft((error) => {
      logger.error("Error on tryCatchWithLogTE", error);
      return makeCustomInteractionError(ErrorType.internalError);
    })
  );

const getInteraction =
  (provider: oidc.Provider, logger: Logger) =>
  (req: express.Request, res: express.Response) =>
    pipe(
      TE.tryCatch(() => provider.interactionDetails(req, res), E.toError),
      TE.chainFirst((interaction) =>
        TE.of(logger.debug(`interaction ${JSON.stringify(interaction)}`))
      ),
      TE.chain(
        flow(CustomInteraction.decode, TE.fromEither, TE.mapLeft(errorsToError))
      ),
      TE.orElseFirst((error) =>
        TE.of(logger.error("getInteraction decode error", error))
      ),
      TE.mapLeft((_) => makeCustomInteractionError(ErrorType.internalError))
    );

const finishInteraction =
  (provider: oidc.Provider, logger: Logger) =>
  (
    req: express.Request,
    res: express.Response,
    result: CustomInteractionResult
  ) =>
    pipe(
      tryCatchWithLogTE(
        () => provider.interactionFinished(req, res, result),
        logger
      ),
      TE.orElseFirst((error) =>
        TE.of(logger.error("finishInteraction error", error))
      ),
      TE.mapLeft((_) => makeCustomInteractionError(ErrorType.internalError))
    );

const createGrant =
  (provider: oidc.Provider, logger: Logger) =>
  (interaction: CustomInteraction): T.Task<CustomInteractionResult> => {
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
        return newGrant;
      })
    );
    // Persist and return the grant
    return pipe(
      TE.fromOption(() => makeCustomInteractionError(ErrorType.accessDenied))(
        maybeGrant
      ),
      TE.chain((grant) => tryCatchWithLogTE(() => grant.save(), logger)),
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

type ProviderService = ReturnType<typeof makeService>;

const makeService = (provider: oidc.Provider, logger: Logger) => ({
  createGrant: createGrant(provider, logger),
  finishInteraction: finishInteraction(provider, logger),
  getClient: getClient(provider, logger),
  getInteraction: getInteraction(provider, logger),
});

export { ErrorType, ProviderService, makeService };
