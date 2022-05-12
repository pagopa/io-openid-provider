import { Interaction, InteractionId } from "../types";
import { client } from "../../clients/__tests__/data";
import { identity } from "../../identities/__tests__/data";
import { grant } from "../../grants/__tests__/data";

export const interaction: Interaction = {
  expireAt: new Date(),
  id: "interaction-id" as InteractionId,
  issuedAt: new Date(),
  payload: {
    key0: "value0",
    key1: "value1",
  },
  params: {
    client_id: client.clientId,
    nonce: "nonce",
    redirect_uri: "https://rp.callback.sh/cb",
    response_mode: "form_post",
    response_type: client.responseTypes[0],
    scope: client.scope,
    state: "state",
  },
  result: undefined,
};

export const afterLoginInteraction: Interaction = {
  ...interaction,
  result: {
    identityId: identity.id,
  },
};

export const afterConsentInteraction: Interaction = {
  ...interaction,
  result: {
    identityId: identity.id,
    grantId: grant.id,
  },
};
