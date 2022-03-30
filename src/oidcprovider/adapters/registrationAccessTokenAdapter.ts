import { constVoid } from "fp-ts/function";
import * as oidc from "oidc-provider";
import { Logger } from "../../logger";
import { makeNotImplementedAdapter } from "./utils";

/**
 * Return an Adapter of RegistrationAccessToken entity that produce a token given
 * a clientId. This adapter is used to allow to provide client_id as
 * access token required to call the CRUD endpoint about Client.
 */
export const makeRegistrationAccessTokenAdapter = (
  logger: Logger,
  name: string = "RegistrationAccessToken",
  // just for test purpose
  now: () => Date = () => new Date()
): oidc.Adapter => ({
  ...makeNotImplementedAdapter(name, logger),
  // remove a token
  destroy: (id: string) => {
    logger.debug(`${name} destroy, id: ${id}`);
    return Promise.resolve(constVoid());
  },
  // given the identifier return a token
  find: (id: string) => {
    logger.debug(`${name} find, id: ${id}`);
    const registrationAccessToken: oidc.AdapterPayload = {
      clientId: id,
      iat: new Date(now().getDate() + 1).getTime(),
      jti: id,
    };
    return Promise.resolve(registrationAccessToken);
  },
  // insert or update the client identified with the given id
  upsert: (id: string, payload: oidc.AdapterPayload, expiresIn: number) => {
    logger.debug(
      `${name} upsert, id: ${id}, _expiresIn: ${expiresIn}, payload: ${JSON.stringify(
        payload
      )}`
    );
    return Promise.resolve(constVoid());
  },
});
