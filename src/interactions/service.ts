import express from "express";
import * as t from "io-ts";
import * as PR from "io-ts/PathReporter";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import * as oidc from "oidc-provider";
import { flow, pipe } from "fp-ts/lib/function";
import { Logger } from "../logger";
import { FederationToken } from "../identities/service";

// this type is a mapping of oidc.Interaction
// useful to improve typing
const CustomInteraction = t.intersection([
  t.type({
    params: t.type({
      client_id: t.string,
    }),
    prompt: t.type({
      details: t.partial({
        missingOIDCScope: t.readonlyArray(t.string),
      }),
      name: t.union([t.literal("login"), t.literal("consent")]),
    }),
    uid: t.string,
  }),
  t.partial({
    session: t.type({
      accountId: t.string,
    }),
  }),
]);
type CustomInteraction = t.TypeOf<typeof CustomInteraction>;

enum ErrorType {
  internalError = "internal_error",
  accessDenied = "access_denied",
  invalidClient = "invalid_client",
}

// this type is a mapping of oidc.InteractionResult
// useful to improve typing
const CustomInteractionResult = t.union([
  t.type({
    login: t.type({
      accountId: FederationToken,
    }),
  }),
  t.type({
    consent: t.type({
      grantId: t.string,
    }),
  }),
  t.type({
    error: t.union([
      t.literal(ErrorType.internalError),
      t.literal(ErrorType.accessDenied),
      t.literal(ErrorType.invalidClient),
    ]),
  }),
]);
type CustomInteractionResult = t.TypeOf<typeof CustomInteractionResult>;

// Given a t.Errors return an Error
const errorsToError = flow(
  PR.failure,
  (errors) => new Error(errors.join("\n"))
);

const tryCatchWithLogTE = <A>(f: () => Promise<A>, logger: Logger) =>
  pipe(
    TE.tryCatch(f, E.toError),
    TE.mapLeft((error) => {
      logger.error("Error on tryCatchWithLogTE", error);
      return { error: ErrorType.internalError };
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
      TE.mapLeft((_error) => ({ error: ErrorType.internalError }))
    );

const finishInteraction =
  (provider: oidc.Provider, logger: Logger) =>
  (
    req: express.Request,
    res: express.Response,
    result: CustomInteractionResult
  ) =>
    pipe(
      TE.tryCatch(
        () => provider.interactionFinished(req, res, result),
        E.toError
      ),
      TE.orElseFirst((error) =>
        TE.of(logger.error("finishInteraction error", error))
      ),
      TE.mapLeft((_error) => ({ error: ErrorType.internalError }))
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
      TE.fromOption(() => ({ error: ErrorType.accessDenied }))(maybeGrant),
      TE.chain((grant) => tryCatchWithLogTE(() => grant.save(), logger)),
      TE.bimap(
        (_error) => ({ error: ErrorType.internalError }),
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
      TE.tryCatch(() => provider.Client.find(clientId), E.toError),
      // transform the error into a internal_error
      TE.mapLeft((error) => {
        logger.error("getClient error", error);
        return { error: ErrorType.internalError };
      }),
      // transform the undefined into a invalid_client
      TE.chain(
        flow(
          O.fromNullable,
          TE.fromOption(() => ({ error: ErrorType.invalidClient }))
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
