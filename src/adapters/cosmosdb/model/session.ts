import * as t from "io-ts";
import { Timestamp } from "@pagopa/io-functions-commons/dist/generated/definitions/Timestamp.js";
import { Container } from "@azure/cosmos";
import { Option } from "fp-ts/lib/Option.js";

import {
  CosmosErrors,
  CosmosResource,
  toCosmosErrorResponse,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model.js";
import {
  CosmosdbModelTTL,
  Ttl,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model_ttl.js";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings.js";
import { TaskEither } from "fp-ts/lib/TaskEither.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { pipe } from "fp-ts/lib/function.js";

export const SESSION_COLLECTION_NAME = "session";
const SESSION_MODEL_PK_FIELD = "id";
const SESSION_PARTITION_KEY_FIELD = "id";

const SessionBaseR = t.interface({
  expireAt: Timestamp,
  id: NonEmptyString,
  issuedAt: Timestamp,
  uid: NonEmptyString,
});
const SessionBaseO = t.partial({
  identityId: t.string,
  ttl: Ttl,
});
const CosmosSession = t.intersection(
  [SessionBaseR, SessionBaseO],
  "CosmosSession"
);
export type CosmosSession = t.TypeOf<typeof CosmosSession>;

export const RetrievedSession = t.intersection([CosmosSession, CosmosResource]);
export type RetrievedSession = t.TypeOf<typeof RetrievedSession>;

export class SessionModel extends CosmosdbModelTTL<
  CosmosSession,
  CosmosSession,
  RetrievedSession,
  typeof SESSION_MODEL_PK_FIELD,
  typeof SESSION_PARTITION_KEY_FIELD
> {
  /**
   * Creates a new Session model
   *
   * @param container the Cosmos container Session
   */
  constructor(container: Container) {
    super(container, CosmosSession, RetrievedSession);
  }

  /**
   * Returns the Session object associated to the sessionId.
   *
   * @param sessionId The Id of the session
   */
  public findOne(
    sessionId: NonEmptyString
  ): TaskEither<CosmosErrors, Option<RetrievedSession>> {
    return this.findOneByQuery({
      parameters: [
        {
          name: "@sessionId",
          value: sessionId,
        },
      ],
      query: `SELECT * FROM n WHERE n.${SESSION_MODEL_PK_FIELD} = @sessionId`,
    });
  }

  /**
   * Returns the Session object associated to the uid.
   *
   * @param uid The Id of the session
   */
  public findOneByUid(
    uid: NonEmptyString
  ): TaskEither<CosmosErrors, Option<RetrievedSession>> {
    return this.findOneByQuery({
      parameters: [
        {
          name: "@uid",
          value: uid,
        },
      ],
      query: `SELECT * FROM n WHERE n.uid = @uid`,
    });
  }

  /**
   * Delete the Session associated to the sessionId
   *
   * @param sessionId The Id of the session
   */
  public delete(sessionId: NonEmptyString): TaskEither<CosmosErrors, string> {
    return pipe(
      TE.tryCatch(
        () => this.container.item(sessionId, sessionId).delete(),
        toCosmosErrorResponse
      ),
      TE.map((_) => _.item.id)
    );
  }
}
