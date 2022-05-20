import { identity } from "../../identities/__tests__/data";
import { Session, SessionId, Uid } from "../types";

export const session: Session = {
  expireAt: new Date(new Date().getTime() + 1000 * 60),
  id: "session-id" as SessionId,
  identityId: identity.id,
  issuedAt: new Date(),
  uid: "uid" as Uid,
};
